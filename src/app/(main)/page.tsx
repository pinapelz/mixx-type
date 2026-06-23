"use client";
import { useEffect, useState } from "react";
import { FaPlay, FaMusic, FaSearch } from "react-icons/fa";
import { MdLibraryMusic } from "react-icons/md";
import { useAuth } from "../context/auth";
import pb from "../lib/pocketbase";
import {
  Root,
  Navbar,
  Logo,
  LogoIcon,
  NavCtaLink,
  NavLeft,
  NavCenter,
  SearchBox,
  SearchInput,
  SearchButton,
  NavRight,

  GridContainer,
  CardGrid,
  Card,
  ThumbnailWrapper,
  Thumbnail,
  PlayOverlay,
  PlayCircle,
  CardMeta,
  CardInfo,
  CardTitle,
  CardSub,
  CardTag,
  EmptyState,
  TypingGlobalStyle,
} from "../page.styles";

interface ChartRecord {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  lrc: string;
  media: string;
  offset: number;
  category: string;
}


export default function TypingPage() {
  const { user } = useAuth();
  const [charts, setCharts] = useState<ChartRecord[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    pb.collection("charts")
      .getFullList<ChartRecord>({ sort: "-created" })
      .then(setCharts)
      .catch(console.error);
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? charts.filter(
        (item) =>
          item.title.includes(normalizedSearch) ||
          item.artist.includes(normalizedSearch) ||
          item.category.includes(normalizedSearch)
      )
    : charts;

  return (
    <>
      <TypingGlobalStyle />
      <Root>
      <Navbar>
        <NavLeft>
          <Logo href="/">
            <LogoIcon>
              <MdLibraryMusic />
            </LogoIcon>
            TypingMIXX
          </Logo>
        </NavLeft>

        <NavCenter>
          <SearchBox>
            <SearchInput
              placeholder="Search typing charts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SearchButton aria-label="Search">
              <FaSearch />
            </SearchButton>
          </SearchBox>
        </NavCenter>

        <NavRight>f
          {user ? (
            null
          ) : (
            <NavCtaLink href="/signin">Sign in</NavCtaLink>
          )}
        </NavRight>
      </Navbar>

      <GridContainer>
        <CardGrid>
          {filtered.length === 0 ? (
            <EmptyState>No results found.</EmptyState>
          ) : (
            filtered.map((item) => (
              <Card key={item.id} href={`/game/${item.id}`} rel="noopener noreferrer">
                <ThumbnailWrapper>
                  {item.thumbnail ? (
                    <Thumbnail src={item.thumbnail} alt={item.title} />
                  ) : (
                    <FaMusic />
                  )}
                  <PlayOverlay>
                    <PlayCircle>
                      <FaPlay />
                    </PlayCircle>
                  </PlayOverlay>
                </ThumbnailWrapper>
                <CardMeta>
                  <CardInfo>
                    <CardTitle>{item.title}</CardTitle>
                    <CardSub>{item.artist}</CardSub>
                    <CardTag>{item.category}</CardTag>
                  </CardInfo>
                </CardMeta>
              </Card>
            ))
          )}
        </CardGrid>
      </GridContainer>
      </Root>
    </>
  );
}
