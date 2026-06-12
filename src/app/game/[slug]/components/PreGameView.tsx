"use client";

import { useEffect, useState } from "react";
import pb from "../../../lib/pocketbase";
import {
  StartOverlay,
  PreGameCard,
  PreGameGrid,
  PreGameLeft,
  PreGameRight,
  SongTitleText,
  SongArtistText,
  StartBtn,
  OpacityControl,
  OpacityLabel,
  OpacitySlider,
  OpacityValue,
  PreviewWrap,
  PreviewBtn,
  PreviewHint,
  LeaderboardCard,
  LeaderboardHeader,
  LeaderboardTitle,
  LeaderboardCount,
  LeaderboardList,
  LeaderboardRow,
  LeaderboardRank,
  LeaderboardName,
  LeaderboardScore,
} from "../page.styles";

interface PreGameViewProps {
  isReady: boolean;
  loadingLrc: boolean;
  songTitle: string;
  songArtist: string;
  chartImage: string | undefined,
  chartId: string | null;
  audioUrl: string;
  isVideo: boolean;
  audioVolume: number;
  setAudioVolume: (v: number) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (v: number) => void;
  isPreviewPlaying: boolean;
  onStart: () => void;
  onPreviewToggle: () => void;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

type ScoreRecord = Record<string, unknown> & {
  expand?: {
    user?: unknown;
  };
};

function hasChartRelation(chartValue: unknown, chartId: string): boolean {
  if (typeof chartValue === "string") return chartValue === chartId;
  if (Array.isArray(chartValue)) return chartValue.includes(chartId);
  return false;
}

function extractUserName(record: ScoreRecord): string {
  const expandedUser = record.expand?.user;
  const resolvedExpandedUser = Array.isArray(expandedUser)
    ? expandedUser[0]
    : expandedUser;

  if (resolvedExpandedUser && typeof resolvedExpandedUser === "object") {
    const user = resolvedExpandedUser as Record<string, unknown>;
    const username = typeof user.username === "string" ? user.username.trim() : "";
    const name = typeof user.name === "string" ? user.name.trim() : "";

    if (username) return username;
    if (name) return name;
  }

  return "Unknown";
}

export default function PreGameView({
  isReady,
  loadingLrc,
  songTitle,
  songArtist,
  chartImage,
  chartId,
  audioUrl,
  isVideo,
  audioVolume,
  setAudioVolume,
  backgroundOpacity,
  setBackgroundOpacity,
  isPreviewPlaying,
  onStart,
  onPreviewToggle,
}: PreGameViewProps) {
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (!chartId) {
      setLeaderboardEntries([]);
      return;
    }

    let cancelled = false;

    const loadLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const records = await pb
          .collection("scores")
          .getFullList<ScoreRecord>({ sort: "-score", expand: "user" });

        if (cancelled) return;

        const bestScores = new Map<string, LeaderboardEntry>();

        for (const record of records) {
          if (!hasChartRelation(record.chart, chartId)) continue;

          const score = Number(record.score);
          if (!Number.isFinite(score)) continue;

          const name = extractUserName(record);

          const existing = bestScores.get(name);

          if (!existing || score > existing.score) {
            bestScores.set(name, {
              id: String(record.id),
              name,
              score,
            });
          }
        }

        const topEntries = Array.from(bestScores.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        setLeaderboardEntries(topEntries);
      } catch {
        if (!cancelled) setLeaderboardEntries([]);
      } finally {
        if (!cancelled) setLoadingLeaderboard(false);
      }
    };

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [chartId]);

  return (
    <StartOverlay>
      <PreGameCard>
        <PreGameGrid>
          <PreGameLeft>
            {!isReady ? (
              <>
                <SongTitleText>Loading...</SongTitleText>
                <SongArtistText>Please wait while we load the chart</SongArtistText>
              </>
            ) : (
              <>
                <SongTitleText>{loadingLrc ? "Loading..." : songTitle}</SongTitleText>
                <SongArtistText>{songArtist}</SongArtistText>
                {chartImage ? <img src={chartImage} alt={`${songTitle} cover`} /> : null}
              </>
            )}

            <StartBtn onClick={onStart} disabled={!isReady} suppressHydrationWarning>
              {loadingLrc ? "Loading song..." : "▶  Start Game"}
            </StartBtn>

            <OpacityControl>
              <OpacityLabel>
                Volume
                <OpacityValue>{audioVolume}%</OpacityValue>
              </OpacityLabel>
              <OpacitySlider
                type="range"
                min="0"
                max="100"
                value={audioVolume}
                onChange={(e) => setAudioVolume(Number(e.target.value))}
              />
            </OpacityControl>

            {isVideo && (
              <OpacityControl>
                <OpacityLabel>
                  Background opacity
                  <OpacityValue>{backgroundOpacity}%</OpacityValue>
                </OpacityLabel>
                <OpacitySlider
                  type="range"
                  min="0"
                  max="100"
                  value={backgroundOpacity}
                  onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                />
              </OpacityControl>
            )}

            <PreviewWrap>
              <PreviewBtn onClick={onPreviewToggle} disabled={!audioUrl} suppressHydrationWarning>
                {isPreviewPlaying ? "⏸ Pause Preview" : "▶ Preview Audio"}
              </PreviewBtn>
              <PreviewHint>
                {audioUrl
                  ? "Use preview to test your volume before starting."
                  : "Load a chart to enable audio preview."}
              </PreviewHint>
            </PreviewWrap>
          </PreGameLeft>

          <PreGameRight>
            <LeaderboardCard>
              <LeaderboardHeader>
                <LeaderboardTitle>Leaderboard</LeaderboardTitle>
                <LeaderboardCount>
                  {leaderboardEntries.length
                    ? `Top ${leaderboardEntries.length}`
                    : "Top 0"}
                </LeaderboardCount>
              </LeaderboardHeader>

              {!chartId ? (
                <PreviewHint>Leaderboard unavailable for this chart.</PreviewHint>
              ) : loadingLeaderboard ? (
                <PreviewHint>Loading leaderboard...</PreviewHint>
              ) : leaderboardEntries.length === 0 ? (
                <PreviewHint>No scores yet. Be the first!</PreviewHint>
              ) : (
                <LeaderboardList>
                  {leaderboardEntries.map((entry, index) => (
                    <LeaderboardRow key={entry.id}>
                      <LeaderboardRank>#{index + 1}</LeaderboardRank>
                      <LeaderboardName>{entry.name}</LeaderboardName>
                      <LeaderboardScore>{entry.score.toLocaleString()}</LeaderboardScore>
                    </LeaderboardRow>
                  ))}
                </LeaderboardList>
              )}
            </LeaderboardCard>
          </PreGameRight>
        </PreGameGrid>
      </PreGameCard>
    </StartOverlay>
  );
}
