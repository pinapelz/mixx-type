"use client";

import { useEffect, useState } from "react";
import pb from "../../../lib/pocketbase";
import {
  LeaderboardCard,
  LeaderboardHeader,
  LeaderboardTitle,
  LeaderboardCount,
  LeaderboardList,
  LeaderboardRow,
  LeaderboardRank,
  LeaderboardEntryBody,
  LeaderboardEntryTop,
  LeaderboardName,
  LeaderboardScore,
  LeaderboardMetrics,
  LeaderboardMetric,
  PreviewHint,
} from "../page.styles";

interface ScoreLeaderboardProps {
  chartId: string | null;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  accuracy: number;
  combo: number;
  wpm: number;
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

function asFiniteNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function ScoreLeaderboard({ chartId }: ScoreLeaderboardProps) {
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

          const score = asFiniteNumber(record.score);
          if (!Number.isFinite(score)) continue;

          const name = extractUserName(record);
          const existing = bestScores.get(name);

          if (!existing || score > existing.score) {
            bestScores.set(name, {
              id: String(record.id),
              name,
              score,
              accuracy: asFiniteNumber(record.accuracy),
              combo: asFiniteNumber(record.combo),
              wpm: asFiniteNumber(record.wpm),
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
    <LeaderboardCard>
      <LeaderboardHeader>
        <LeaderboardTitle>Leaderboard</LeaderboardTitle>
        <LeaderboardCount>
          {leaderboardEntries.length ? `Top ${leaderboardEntries.length}` : "Top 0"}
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
              <LeaderboardEntryBody>
                <LeaderboardEntryTop>
                  <LeaderboardName>{entry.name}</LeaderboardName>
                  <LeaderboardScore>{entry.score.toLocaleString()}</LeaderboardScore>
                </LeaderboardEntryTop>
                <LeaderboardMetrics>
                  <LeaderboardMetric>Acc: {entry.accuracy}%</LeaderboardMetric>
                  <LeaderboardMetric>Combo: x{entry.combo}</LeaderboardMetric>
                  <LeaderboardMetric>WPM: {entry.wpm}</LeaderboardMetric>
                </LeaderboardMetrics>
              </LeaderboardEntryBody>
            </LeaderboardRow>
          ))}
        </LeaderboardList>
      )}
    </LeaderboardCard>
  );
}
