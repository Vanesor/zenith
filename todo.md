- encryption decryption chats
- comments likes
- assignment portal
- report genration
- one club ui and stuff
- forum page and positions
- comments, post edit delete.
- events

- database scalability

and also if you create a js for schema change or dummy data remember that .env.local has the supabse credentials i am not using local postgres

-  the distribute equally state when clicked and toast is not working make sure if distribute equally is pressed chagne its color state or something and remove time as distribute equally should distribute time to each questions automatically while saving by dividing the total time with the no of questions
- during addition of questions i see two time field in coding and the time addition validation and points validation are not working
- it is now showing 0 assignements in the assignment column remenber that while saving for all clubs assignement in the table the club is shown as null check the query and schematxt for the databse schema
- fix specific clubs give option to choose multiple clubs from the four with at least one 

---------------

- remove the view detail button from the assignment and add functionality to submit buttion to start the assignment, after clickking the start button show the user instruction according to the assignment type coding tru false mixed and stuff whether or not it contains integer mult selct etc 
- also make sure the full screen, auto save code state allow multiple language and proper editor with compiler and layout like modern professional test platform then af tried ti quit or change window show warning then auto submit and stuff
- if possible add a nice code editor for coding assignemt, prompt use to type begin ansd press enter or click arrow button 


when clicked start assign it showed submitting assignement then itfailed and showed error

when i clikced again it showed the same submitting asssigenment and then started immedialty but it was not full scrrened and i did not see screen telling me to type begin and then starting

timer was wrong during creation it showed time in secinds os i had 5 min but in asssignment it was 300 min

hidden test case during the creation were also visible to me

the layout needs to be better like code chef where their is problem statement on my left hand side and code editor on my right hand side enable full screen for every test remove it as option in assignemnt creation and

use a library for code editor and utilize full space for assignement
- also their was error while submitting the assignement and it was a simple error pleae make sure to use models for  warnings and confirmations too with like red sign and yellow sign in the corner do not use alerts make the ui clean modern and professional 

  - also does changing the user achievent history needs change in the schema if so look into schema.txt and give sql file to copy paste in supabse editor.

  Need changes - 
  1. better ui
  2. fullscreen force
  3. tab and other apps check
  4. auto submit if closed or anything
   ✓ Compiled /api/assignments/[id]/attempts in 149ms (1144 modules)
[dotenv@17.2.1] injecting env (0) from .env.local -- tip: ⚙️  override existing env vars with { override: true }
 GET /api/assignments/b6e3cd48-d1b6-4b70-8010-bb47b8ea3df2 200 in 545ms
Error fetching attempts: SyntaxError: "[object Object]" is not valid JSON
    at JSON.parse (<anonymous>)
    at eval (src/app/api/assignments/[id]/attempts/route.ts:74:20)
    at Array.map (<anonymous>)
    at GET (src/app/api/assignments/[id]/attempts/route.ts:67:41)
  72 |       score: attempt.score,
  73 |       status: attempt.status,
> 74 |       answers: JSON.parse(attempt.answers || '{}'),
     |                    ^
  75 |       violations: JSON.parse(attempt.violations || '[]'),
  76 |       submittedAt: attempt.submitted_at ? attempt.submitted_at.toISOString() : null
  77 |     }));
 GET /api/assignments/b6e3cd48-d1b6-4b70-8010-bb47b8ea3df2/attempts 500 in 699ms
 GET /api/notifications?userId=550e8400-e29b-41d4-a716-446655440020 200 in 746ms
Error fetching attempts: SyntaxError: "[object Object]" is not valid JSON
    at JSON.parse (<anonymous>)
    at eval (src/app/api/assignments/[id]/attempts/route.ts:74:20)
    at Array.map (<anonymous>)
    at GET (src/app/api/assignments/[id]/attempts/route.ts:67:41)
  72 |       score: attempt.score,
  73 |       status: attempt.status,
> 74 |       answers: JSON.parse(attempt.answers || '{}'),
     |                    ^
  75 |       violations: JSON.parse(attempt.violations || '[]'),
  76 |       submittedAt: attempt.submitted_at ? attempt.submitted_at.toISOString() : null
  77 |     }));
 GET /api/assignments/b6e3cd48-d1b6-4b70-8010-bb47b8ea3df2/attempts 500 in 176ms
 GET /api/assignments/b6e3cd48-d1b6-4b70-8010-bb47b8ea3df2 200 in 462ms
Error fetching attempts: SyntaxError: "[object Object]" is not valid JSON
    at JSON.parse (<anonymous>)
    at eval (src/app/api/assignments/[id]/attempts/route.ts:74:20)
    at Array.map (<anonymous>)
    at GET (src/app/api/assignments/[id]/attempts/route.ts:67:41)
  72 |       score: attempt.score,
  73 |       status: attempt.status,
> 74 |       answers: JSON.parse(attempt.answers || '{}'),
     |                    ^
  75 |       violations: JSON.parse(attempt.violations || '[]'),
  76 |       submittedAt: attempt.submitted_at ? attempt.submitted_at.toISOString() : null
  77 |     }));
 GET /api/assignments/b6e3cd48-d1b6-4b70-8010-bb47b8ea3df2/attempts 500 in 171ms
Redis connected successfully
 GET /api/auth/validate 200 in 1809ms
 ✓ Compiled /dashboard in 334ms (1159 modules)
 GET /dashboard 200 in 419ms
 GET /api/auth/check 200 in 30ms
 ✓ Compiled /api/dashboard in 144ms (1161 modules)
[dotenv@17.2.1] injecting env (0) from .env.local -- tip: ⚙️  override existing env vars with { override: true }
 GET /api/auth/check 200 in 262ms
 GET /api/notifications?userId=550e8400-e29b-41d4-a716-446655440020 200 in 737ms
 GET /api/notifications?userId=550e8400-e29b-41d4-a716-446655440020 200 in 79ms
 GET /api/dashboard 200 in 904ms
 GET /api/dashboard 200 in 258ms
 ✓ Compiled /assignments in 499ms (1169 modules)
 GET /assignments 200 in 542ms
 ✓ Compiled /api/assignments in 216ms (1172 modules)
[dotenv@17.2.1] injecting env (0) from .env.local -- tip: 📡 version env with Radar: https://dotenvx.com/radar
(node:76201) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGINT listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
(node:76201) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGTERM listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
 GET /api/assignments 200 in 682ms
 GET /api/assignments 200 in 59ms
^CClosing Redis connection...
Closing database pool...
Closing database pool...
Closing database pool...
Closing database pool...
Closing database pool...
Closing Redis connection...
Closing database pool...
Closing database pool...
Closing database pool...


vane@vane-Predator-PHN16-71:/media/vane/Movies/Projects/zenith$ 
  5. reloaded by mistake goen to login then auto logged in
  6. better token management