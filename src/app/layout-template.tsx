"use client";

import React from "react";
import MainLayout from "@/components/MainLayout";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

export default PageLayout;
