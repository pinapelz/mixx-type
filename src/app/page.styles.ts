import styled, { createGlobalStyle } from "styled-components";
import Link from "next/link";
import {
  Root as BaseRoot,
  Navbar as BaseNavbar,
  Logo as BaseLogo,
  LogoIcon as BaseLogoIcon,
  NavLink as BaseNavLink,
  NavCtaLink as BaseNavCtaLink,
} from "./styles/shared";


const BaseNavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const BaseNavCenter = styled.div`
  display: flex;
  align-items: center;
  flex: 0 1 560px;
`;

const BaseNavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BaseSearchBox = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  height: 38px;
  border: 1px solid #d4d4d4;
  overflow: hidden;
  background-color: #f0f0f0;
  transition: border-color 0.2s;
  &:focus-within {
    border-color: #1a1a1a;
  }
`;

const BaseSearchInput = styled.input`
  flex: 1;
  height: 100%;
  padding: 0 14px;
  background: transparent;
  border: none;
  outline: none;
  color: #1a1a1a;
  font-size: 14px;
  &::placeholder {
    color: #909090;
  }
`;

const BaseSearchButton = styled.button`
  width: 52px;
  height: 100%;
  background-color: #e8e8e8;
  border: none;
  border-left: 1px solid #d4d4d4;
  color: #606060;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: #d4d4d4;
    color: #1a1a1a;
  }
`;

const BaseChipsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  overflow-x: auto;
  background-color: #f9f9f9;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const BaseChip = styled.button<{ $active?: boolean }>`
  white-space: nowrap;
  padding: 7px 16px;
  border: 1px solid ${(p) => (p.$active ? "transparent" : "#d4d4d4")};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  background-color: ${(p) => (p.$active ? "#1a1a1a" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : "#606060")};
  &:hover {
    background-color: ${(p) => (p.$active ? "#333" : "#f0f0f0")};
    color: ${(p) => (p.$active ? "#fff" : "#1a1a1a")};
  }
`;

export const GridContainer = styled.div`
  padding: 8px 24px 24px;
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

const BaseCard = styled(Link)`
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
`;

const BaseThumbnailWrapper = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #e4e4e4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c0c0;
  font-size: 36px;
  overflow: hidden;
  position: relative;
`;

export const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const PlayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0);
  transition: background 0.2s;
  ${BaseCard}:hover & {
    background: rgba(0, 0, 0, 0.25);
  }
`;

export const PlayCircle = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.2s, transform 0.2s;
  ${BaseCard}:hover & {
    opacity: 1;
    transform: scale(1);
  }
`;

export const CardMeta = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding: 0 4px 12px;
`;

export const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`;

const BaseCardTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BaseCardSub = styled.span`
  font-size: 12px;
  color: #909090;
  line-height: 1.3;
`;

const BaseCardTag = styled.span`
  font-size: 10px;
  color: #909090;
  line-height: 1.3;
`;

const BaseEmptyState = styled.div`
  grid-column: 1 / -1;
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: #909090;
`;


export { GridContainer as BaseGridContainer };

export const TypingGlobalStyle = createGlobalStyle`
  html,
  body {
    background-color: #0b0b10;
  }
`;

export const Root = styled(BaseRoot)`
  background-color: #0b0b10;
  color: #f5f5f5;
`;

export const Navbar = styled(BaseNavbar)`
  background-color: rgba(11, 11, 16, 0.9);
  border-bottom: 1px solid #1f1f2a;
`;

export const Logo = styled(BaseLogo)`
  color: #f5f5f5;
`;

export const LogoIcon = styled(BaseLogoIcon)`
  background-color: #f5f5f5;
  color: #0b0b10;
`;

export const NavLink = styled(BaseNavLink)`
  color: #b0b3bd;
  &:hover {
    background-color: #1a1d29;
    color: #fff;
  }
`;

export const NavCtaLink = styled(BaseNavCtaLink)`
  background-color: #1a1d29;
  border-color: #2a2f3d;
  color: #fff;
  &:hover {
    background-color: #222838;
    border-color: #3a4154;
  }
`;

export const NavLeft = styled(BaseNavLeft)``;
export const NavCenter = styled(BaseNavCenter)``;
export const NavRight = styled(BaseNavRight)``;

export const SearchBox = styled(BaseSearchBox)`
  border-color: #2a2f3d;
  background-color: #141824;
  &:focus-within {
    border-color: #4b5563;
  }
`;

export const SearchInput = styled(BaseSearchInput)`
  color: #f5f5f5;
  &::placeholder {
    color: #8b90a0;
  }
`;

export const SearchButton = styled(BaseSearchButton)`
  background-color: #1a1d29;
  border-left-color: #2a2f3d;
  color: #c0c4d0;
  &:hover {
    background-color: #222838;
    color: #fff;
  }
`;

export const ChipsBar = styled(BaseChipsBar)`
  background-color: #0f111a;
`;

export const Chip = styled(BaseChip)`
  border-color: #2a2f3d;
  color: #b8bcc7;
  background-color: transparent;
  &:hover {
    background-color: #1a1d29;
    color: #fff;
  }
`;

export const Card = styled(BaseCard)`
  border: 1px solid #1f1f2a;
  background-color: #0f111a;
  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    border-color: #2a2f3d;
  }
`;

export const ThumbnailWrapper = styled(BaseThumbnailWrapper)`
  background-color: #1a1d29;
  color: #4b5563;
`;

export const CardTitle = styled(BaseCardTitle)`
  color: #f5f5f5;
`;

export const CardSub = styled(BaseCardSub)`
  color: #9aa0ad;
`;

export const CardTag = styled(BaseCardTag)`
  display: inline-block;
  color: #b8bcc7;
  font-size: 10px;
  white-space: nowrap;
`;

export const EmptyState = styled(BaseEmptyState)`
  color: #9aa0ad;
`;
