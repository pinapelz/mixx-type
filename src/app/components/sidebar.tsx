"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { ChevronLeft, ChevronRight, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../context/auth";
import { navItems } from "./nav-items";

const SidebarRoot = styled.aside<{ $collapsed: boolean }>`
  width: ${(p) => (p.$collapsed ? "52px" : "200px")};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1f1f2a;
  background-color: #0b0b10;
  overflow: hidden;
  transition: width 0.2s ease;
`;

const ToggleBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  width: 100%;
  flex-shrink: 0;
  background: none;
  border: none;
  border-bottom: 1px solid #1f1f2a;
  cursor: pointer;
  color: #8b90a0;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background-color: #1a1d29;
    color: #f5f5f5;
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const NavItem = styled(Link)<{ $active: boolean; $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  gap: ${(p) => (p.$collapsed ? "0" : "10px")};
  padding: ${(p) => (p.$collapsed ? "9px 0" : "9px 12px")};
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: ${(p) => (p.$active ? "#f5f5f5" : "#8b90a0")};
  background-color: ${(p) => (p.$active ? "#1a1d29" : "transparent")};
  border-left: 2px solid ${(p) => (p.$active ? "#a78bfa" : "transparent")};
  transition: background 0.15s, color 0.15s;
  &:hover {
    background-color: #1a1d29;
    color: #f5f5f5;
  }
`;

const Label = styled.span<{ $collapsed: boolean }>`
  max-width: ${(p) => (p.$collapsed ? "0" : "200px")};
  overflow: hidden;
  white-space: nowrap;
  opacity: ${(p) => (p.$collapsed ? 0 : 1)};
  transition: max-width 0.2s ease, opacity 0.1s ease;
`;


const Footer = styled.div`
  padding: 12px 8px;
  border-top: 1px solid #1f1f2a;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Username = styled.span<{ $collapsed: boolean }>`
  display: block;
  padding: ${(p) => (p.$collapsed ? "0" : "6px 12px")};
  max-height: ${(p) => (p.$collapsed ? "0" : "28px")};
  font-size: 12px;
  color: #4b5563;
  overflow: hidden;
  white-space: nowrap;
  opacity: ${(p) => (p.$collapsed ? 0 : 1)};
  transition: max-height 0.2s ease, padding 0.2s ease, opacity 0.1s ease;
`;

const AuthButton = styled.button<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  gap: 10px;
  padding: 9px 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: #8b90a0;
  width: 100%;
  text-align: left;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background-color: #1a1d29;
    color: #f5f5f5;
  }
`;

const AuthLink = styled(Link)<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  gap: 10px;
  padding: 9px 12px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: #8b90a0;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background-color: #1a1d29;
    color: #f5f5f5;
  }
`;

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarRoot $collapsed={collapsed}>
      <ToggleBtn
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </ToggleBtn>

      <Nav>
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <NavItem key={item.href} href={item.href} $active={active} $collapsed={collapsed}>
              <Icon size={16} />
              <Label $collapsed={collapsed}>{item.title}</Label>
            </NavItem>
          );
        })}
      </Nav>

      <Footer>
        {user ? (
          <>
            <Username $collapsed={collapsed}>{user.name}</Username>
            <AuthButton $collapsed={collapsed} onClick={signOut}>
              <LogOut size={16} />
              <Label $collapsed={collapsed}>Sign out</Label>
            </AuthButton>
          </>
        ) : (
          <AuthLink href="/signin" $collapsed={collapsed}>
            <LogIn size={16} />
            <Label $collapsed={collapsed}>Sign in</Label>
          </AuthLink>
        )}
      </Footer>
    </SidebarRoot>
  );
}
