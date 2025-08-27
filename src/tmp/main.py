from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import subprocess
import tempfile
import os
import uuid
import time
import signal
import re
from typing import Optional, Dict, Any, List
import asyncio
import shutil
import psutil
import resource
import logging
import sys
from datetime import datetime
import json
import uvicorn

# Configure comprehensive logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/compiler_service.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("zenith_compiler")

# Security configuration
security = HTTPBearer()
API_KEY = os.getenv("API_KEY")  # Must be set in environment - no default fallback
start_time = time.time()

# Validate API key is configured
if not API_KEY:
    logger.error("API_KEY environment variable is required but not set!")
    raise RuntimeError("API_KEY environment variable must be configured")

# Log startup
logger.info("=== Zenith Code Compiler API Starting ===")
logger.info(f"API Key configured: Yes (length: {len(API_KEY)} chars)")
logger.info(f"Supported languages: {', '.join(['python', 'c', 'cpp', 'java', 'javascript'])}")

# Request ID for tracking
def generate_request_id():
    return str(uuid.uuid4())[:8]

app = FastAPI(title="Zenith Code Compiler API", version="1.0.0")

# Authentication dependency
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != API_KEY:
        logger.warning(f"Unauthorized access attempt with token: {credentials.credentials[:10]}...")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = generate_request_id()
    start_time = time.time()
    
    # Log request
    logger.info(f"[{request_id}] {request.method} {request.url} - Client: {request.client.host if request.client else 'unknown'}")
    
    # Add request ID to request state
    request.state.request_id = request_id
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log response
        logger.info(f"[{request_id}] Response: {response.status_code} - Time: {process_time:.3f}s")
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        return response
    
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"[{request_id}] Error: {str(e)} - Time: {process_time:.3f}s")
        raise

# CORS middleware to allow requests from your main website
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-zenith-app.vercel.app",  # Replace with your actual domain
        "https://your-custom-domain.com",     # Add your custom domain if any
        "http://localhost:3000",              # For local development
        "*"  # Remove this in production for security
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

class CodeExecutionRequest(BaseModel):
    code: str
    language: str
    input: Optional[str] = ""
    timeout: Optional[int] = 10  # seconds
    testCases: Optional[list] = []  # For running against test cases

class TestCaseResult(BaseModel):
    input: str
    expectedOutput: str
    actualOutput: str
    passed: bool
    executionTime: float
    memoryUsed: Optional[int] = None  # in KB
    cpuUsage: Optional[float] = None  # percentage
    status: str = "completed"  # completed, timeout, error, compilation_error

class ExecutionSummary(BaseModel):
    totalTestCases: int
    passedTestCases: int
    failedTestCases: int
    successRate: float  # percentage
    totalExecutionTime: float
    averageExecutionTime: float
    maxMemoryUsed: Optional[int] = None  # in KB
    totalCpuTime: Optional[float] = None
    compilationTime: Optional[float] = None
    status: str  # all_passed, partial, all_failed, compilation_error

class CodeExecutionResponse(BaseModel):
    success: bool
    output: str
    error: str
    execution_time: float
    memory_used: Optional[int] = None
    testResults: Optional[List[TestCaseResult]] = []
    executionSummary: Optional[ExecutionSummary] = None
    language: str = ""
    codeLength: int = 0

# Language configurations - optimized for Zenith platform
LANGUAGE_CONFIG = {
    "python": {
        "extension": ".py",
        "compile_cmd": None,
        "run_cmd": "python3 {filename}",
        "timeout": 10
    },
    "c": {
        "extension": ".c",
        "compile_cmd": "gcc -o {executable} {filename} -std=c99 -lm -O2",
        "run_cmd": "./{executable}",
        "timeout": 10
    },
    "cpp": {
        "extension": ".cpp",
        "compile_cmd": "g++ -o {executable} {filename} -std=c++17 -O2",
        "run_cmd": "./{executable}",
        "timeout": 10
    },
    "java": {
        "extension": ".java",
        "compile_cmd": "javac {filename}",
        "run_cmd": "java {classname}",
        "timeout": 15
    },
    "javascript": {
        "extension": ".js",
        "compile_cmd": None,
        "run_cmd": "node {filename}",
        "timeout": 10
    }
}

def create_temp_file(code: str, language: str) -> tuple:
    """Create a temporary file with the code"""
    config = LANGUAGE_CONFIG.get(language)
    if not config:
        raise ValueError(f"Unsupported language: {language}")
    
    # Create unique filename
    unique_id = str(uuid.uuid4())[:8]
    
    if language == "java":
        # Java requires specific class name - extract or create one
        import re
        class_match = re.search(r'public\s+class\s+(\w+)', code)
        if class_match:
            class_name = class_match.group(1)
        else:
            # If no class found, create a default one
            class_name = f"Solution{unique_id}"
            # Wrap code in a class if it's not already
            if 'class ' not in code:
                code = f"""public class {class_name} {{
    public static void main(String[] args) {{
        {code}
    }}
}}"""
            else:
                # Replace any existing class name
                code = re.sub(r'public\s+class\s+\w+', f'public class {class_name}', code)
                code = re.sub(r'class\s+\w+', f'class {class_name}', code)
        
        filename = f"{class_name}.java"
    else:
        filename = f"solution_{unique_id}{config['extension']}"
    
    # Create temporary directory
    temp_dir = tempfile.mkdtemp()
    file_path = os.path.join(temp_dir, filename)
    
    # Write code to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    
    return temp_dir, filename, file_path

async def run_command_with_timeout(cmd: str, input_data: str, timeout: int, cwd: str, request_id: str = None) -> tuple:
    """Run command with timeout and capture output, memory, and CPU usage"""
    if request_id:
        logger.info(f"[{request_id}] Executing command: {cmd[:100]}...")
    
    try:
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
            preexec_fn=os.setsid if os.name != 'nt' else None
        )
        
        start_time = time.time()
        start_cpu_time = time.process_time()
        max_memory = 0
        
        if request_id:
            logger.info(f"[{request_id}] Process started with PID: {process.pid}")
        
        try:
            # Monitor process during execution
            async def monitor_process():
                nonlocal max_memory
                try:
                    while process.returncode is None:
                        try:
                            proc = psutil.Process(process.pid)
                            memory_info = proc.memory_info()
                            max_memory = max(max_memory, memory_info.rss // 1024)  # Convert to KB
                            await asyncio.sleep(0.01)  # Check every 10ms
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            break
                except Exception:
                    pass
            
            # Start monitoring task
            monitor_task = asyncio.create_task(monitor_process())
            
            # Execute process with timeout
            stdout, stderr = await asyncio.wait_for(
                process.communicate(input=input_data.encode() if input_data else None),
                timeout=timeout
            )
            
            # Cancel monitoring
            monitor_task.cancel()
            
            execution_time = time.time() - start_time
            cpu_time = time.process_time() - start_cpu_time
            cpu_usage = (cpu_time / execution_time * 100) if execution_time > 0 else 0
            
            if request_id:
                logger.info(f"[{request_id}] Command completed - Exit code: {process.returncode}, Time: {execution_time:.3f}s, Memory: {max_memory}KB, CPU: {cpu_usage:.1f}%")
            
            return (
                stdout.decode('utf-8', errors='replace'),
                stderr.decode('utf-8', errors='replace'),
                process.returncode,
                execution_time,
                max_memory,
                cpu_usage
            )
            
        except asyncio.TimeoutError:
            # Kill the process group
            if os.name != 'nt':
                try:
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                except:
                    pass
            else:
                process.terminate()
            
            try:
                await process.wait()
            except:
                pass
                
            return "", "Time Limit Exceeded", -1, timeout, max_memory, 0
            
    except Exception as e:
        return "", f"Execution error: {str(e)}", -1, 0, 0, 0

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {
        "message": "Zenith Code Compiler API",
        "status": "running",
        "version": "1.0.0",
        "supported_languages": list(LANGUAGE_CONFIG.keys()),
        "authentication": "Bearer token required for protected endpoints"
    }

@app.get("/languages")
async def get_supported_languages():
    """Get list of supported programming languages"""
    logger.info("Languages endpoint accessed")
    return {
        "languages": [
            {
                "name": lang,
                "extension": config["extension"],
                "timeout": config["timeout"]
            }
            for lang, config in LANGUAGE_CONFIG.items()
        ]
    }

@app.post("/compile", response_model=CodeExecutionResponse)
async def compile_code(request: CodeExecutionRequest, token: str = Depends(verify_token)):
    """Compile and execute code with comprehensive test case evaluation and execution summary"""
    request_id = generate_request_id()
    
    logger.info(f"[{request_id}] Compile request - Language: {request.language}, Code length: {len(request.code)}, Test cases: {len(request.testCases) if request.testCases else 0}")
    
    if request.language not in LANGUAGE_CONFIG:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported language: {request.language}. Supported: {list(LANGUAGE_CONFIG.keys())}"
        )
    
    config = LANGUAGE_CONFIG[request.language]
    temp_dir = None
    test_results = []
    compilation_time = 0
    
    try:
        # Create temporary file
        temp_dir, filename, file_path = create_temp_file(request.code, request.language)
        
        # Compilation step (if needed)
        if config["compile_cmd"]:
            executable_name = filename.rsplit('.', 1)[0]
            
            if request.language == "java":
                class_name = filename.rsplit('.', 1)[0]
                compile_cmd = config["compile_cmd"].format(filename=filename)
                run_cmd = config["run_cmd"].format(classname=class_name)
            else:
                compile_cmd = config["compile_cmd"].format(
                    filename=filename, 
                    executable=executable_name
                )
                run_cmd = config["run_cmd"].format(executable=executable_name)
            
            # Compile with monitoring
            compile_stdout, compile_stderr, compile_code, compilation_time, compile_memory, compile_cpu = await run_command_with_timeout(
                compile_cmd, "", 30, temp_dir, request_id
            )
            
            if compile_code != 0:
                return CodeExecutionResponse(
                    success=False,
                    output="",
                    error=f"Compilation Error:\n{compile_stderr}",
                    execution_time=compilation_time,
                    memory_used=compile_memory,
                    testResults=[],
                    executionSummary=ExecutionSummary(
                        totalTestCases=len(request.testCases) if request.testCases else 0,
                        passedTestCases=0,
                        failedTestCases=len(request.testCases) if request.testCases else 0,
                        successRate=0.0,
                        totalExecutionTime=compilation_time,
                        averageExecutionTime=0.0,
                        maxMemoryUsed=compile_memory,
                        compilationTime=compilation_time,
                        status="compilation_error"
                    ),
                    language=request.language,
                    codeLength=len(request.code)
                )
        else:
            # No compilation needed
            run_cmd = config["run_cmd"].format(filename=filename)
        
        # If test cases provided, run against each test case
        if request.testCases:
            all_passed = True
            total_execution_time = 0
            max_memory_overall = 0
            total_cpu_time = 0
            
            for i, test_case in enumerate(request.testCases):
                test_input = test_case.get("input", "")
                expected_output = test_case.get("expectedOutput", "").strip()
                
                # Execute with test input and monitor resources
                stdout, stderr, return_code, exec_time, memory_used, cpu_usage = await run_command_with_timeout(
                    run_cmd,
                    test_input,
                    request.timeout or config["timeout"],
                    temp_dir,
                    request_id
                )
                
                total_execution_time += exec_time
                max_memory_overall = max(max_memory_overall, memory_used or 0)
                total_cpu_time += cpu_usage
                
                actual_output = stdout.strip()
                
                # Determine test status
                if "Time Limit Exceeded" in stderr:
                    test_status = "timeout"
                    test_passed = False
                elif return_code != 0:
                    test_status = "error"
                    test_passed = False
                else:
                    test_status = "completed"
                    test_passed = actual_output == expected_output
                
                if not test_passed:
                    all_passed = False
                
                test_results.append(TestCaseResult(
                    input=test_input,
                    expectedOutput=expected_output,
                    actualOutput=actual_output if return_code == 0 else f"Runtime Error: {stderr}",
                    passed=test_passed,
                    executionTime=exec_time,
                    memoryUsed=memory_used,
                    cpuUsage=cpu_usage,
                    status=test_status
                ))
            
            # Calculate execution summary
            passed_count = sum(1 for t in test_results if t.passed)
            failed_count = len(test_results) - passed_count
            success_rate = (passed_count / len(test_results) * 100) if test_results else 0
            avg_execution_time = total_execution_time / len(test_results) if test_results else 0
            
            # Determine overall status
            if passed_count == len(test_results):
                overall_status = "all_passed"
            elif passed_count == 0:
                overall_status = "all_failed"
            else:
                overall_status = "partial"
            
            execution_summary = ExecutionSummary(
                totalTestCases=len(test_results),
                passedTestCases=passed_count,
                failedTestCases=failed_count,
                successRate=success_rate,
                totalExecutionTime=total_execution_time,
                averageExecutionTime=avg_execution_time,
                maxMemoryUsed=max_memory_overall,
                totalCpuTime=total_cpu_time,
                compilationTime=compilation_time,
                status=overall_status
            )
            
            return CodeExecutionResponse(
                success=all_passed,
                output=f"Executed {len(test_results)} test cases. {passed_count} passed, {failed_count} failed.\nSuccess Rate: {success_rate:.1f}%",
                error="" if all_passed else f"{failed_count} test case(s) failed",
                execution_time=total_execution_time,
                memory_used=max_memory_overall,
                testResults=test_results,
                executionSummary=execution_summary,
                language=request.language,
                codeLength=len(request.code)
            )
        
        else:
            # Execute with provided input (or no input) - single execution
            stdout, stderr, return_code, execution_time, memory_used, cpu_usage = await run_command_with_timeout(
                run_cmd,
                request.input or "",
                request.timeout or config["timeout"],
                temp_dir,
                request_id
            )
            
            # Determine success
            success = return_code == 0 and "Time Limit Exceeded" not in stderr
            
            # Create summary for single execution
            execution_summary = ExecutionSummary(
                totalTestCases=1,
                passedTestCases=1 if success else 0,
                failedTestCases=0 if success else 1,
                successRate=100.0 if success else 0.0,
                totalExecutionTime=execution_time,
                averageExecutionTime=execution_time,
                maxMemoryUsed=memory_used,
                totalCpuTime=cpu_usage,
                compilationTime=compilation_time,
                status="all_passed" if success else "all_failed"
            )
            
            return CodeExecutionResponse(
                success=success,
                output=stdout,
                error=stderr,
                execution_time=execution_time,
                memory_used=memory_used,
                testResults=[],
                executionSummary=execution_summary,
                language=request.language,
                codeLength=len(request.code)
            )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        return CodeExecutionResponse(
            success=False,
            output="",
            error=f"Internal server error: {str(e)}",
            execution_time=0,
            memory_used=0,
            testResults=[],
            executionSummary=ExecutionSummary(
                totalTestCases=len(request.testCases) if request.testCases else 1,
                passedTestCases=0,
                failedTestCases=len(request.testCases) if request.testCases else 1,
                successRate=0.0,
                totalExecutionTime=0.0,
                averageExecutionTime=0.0,
                maxMemoryUsed=0,
                compilationTime=0.0,
                status="error"
            ),
            language=request.language,
            codeLength=len(request.code)
        )
    finally:
        # Cleanup
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except:
                pass

@app.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest, token: str = Depends(verify_token)):
    """Enhanced execution endpoint with authentication and logging"""
    request_id = generate_request_id()
    logger.info(f"[{request_id}] Execute request - Language: {request.language}, Code length: {len(request.code)}, Test cases: {len(request.testCases) if request.testCases else 0}")
    
    result = await compile_code(request, token)
    
    logger.info(f"[{request_id}] Execute completed - Success: {result.success}, Execution time: {result.execution_time:.3f}s")
    return result

@app.post("/test", response_model=CodeExecutionResponse)
async def test_code(request: CodeExecutionRequest, token: str = Depends(verify_token)):
    """Test code against provided test cases with authentication and logging"""
    request_id = generate_request_id()
    logger.info(f"[{request_id}] Test request - Language: {request.language}, Test cases: {len(request.testCases) if request.testCases else 0}")
    
    result = await compile_code(request, token)
    
    logger.info(f"[{request_id}] Test completed - Success: {result.success}")
    return result

@app.get("/health")
async def health_check():
    """Health check endpoint - no authentication required"""
    logger.info("Health check accessed")
    return {
        "status": "healthy", 
        "timestamp": time.time(),
        "service": "Zenith Code Compiler",
        "version": "1.0.0",
        "uptime": time.time() - start_time if 'start_time' in globals() else "unknown"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=int(os.environ.get("PORT", 8000)),
        reload=True
    )
