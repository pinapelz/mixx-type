"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ResultsOverlay,
  ResultsCard,
  ResultsTitle,
  BigScore,
  StatsGrid,
  StatBlock,
  StatValue,
  StatLabel,
  ActionRow,
  PlayAgainBtn,
  HomeBtn,
  PreviewHint,
} from "../page.styles";
import ScoreLeaderboard from "./ScoreLeaderboard";
import { GState } from "../game.stat";
import { useAuth } from "../../../context/auth";
import pb from "../../../lib/pocketbase";

interface ResultsViewProps {
  g: GState;
  accuracy: number;
  wpm: number;
  songTitle: string;
  chartId: string | null;
  onPlayAgain: () => void;
}

export default function ResultsView({
  g,
  accuracy,
  wpm,
  songTitle,
  chartId,
  onPlayAgain,
}: ResultsViewProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const hasTriedAutoUploadRef = useRef(false);
  const [isUploadingScore, setIsUploadingScore] = useState(false);
  const [isUploadFlowComplete, setIsUploadFlowComplete] = useState(false);

  useEffect(() => {
    if (hasTriedAutoUploadRef.current) return;
    if (loading) return;

    hasTriedAutoUploadRef.current = true;

    if (!user || !chartId) {
      setIsUploadFlowComplete(true);
      return;
    }

    const dedupeKey = `scores:auto:${chartId}:${user.id}:${g.score}:${wpm}:${g.maxCombo}:${g.totalMiss}:${accuracy}`;

    if (sessionStorage.getItem(dedupeKey) === "1") {
      setIsUploadFlowComplete(true);
      return;
    }

    const uploadScore = async () => {
      setIsUploadingScore(true);
      try {
        try {
          await pb.collection("scores").create({
            accuracy,
            combo: g.maxCombo,
            wpm,
            miss: g.totalMiss,
            score: g.score,
            user: user.id,
            chart: chartId,
          });
        } catch {
          await pb.collection("scores").create({
            accuracy,
            combo: g.maxCombo,
            wpm,
            miss: g.totalMiss,
            score: g.score,
            user: [user.id],
            chart: [chartId],
          });
        }

        sessionStorage.setItem(dedupeKey, "1");
        toast.success("Score uploaded.", { theme: "dark" });
      } catch {
        toast.error("Failed to upload score. Please try again.", { theme: "dark" });
      } finally {
        setIsUploadingScore(false);
        setIsUploadFlowComplete(true);
      }
    };

    void uploadScore();
  }, [accuracy, chartId, g.maxCombo, g.score, g.totalMiss, loading, user, wpm]);

  return (
    <ResultsOverlay>
      <ResultsCard>
        <ResultsTitle>Results — {songTitle}</ResultsTitle>
        <BigScore>{g.score.toLocaleString()}</BigScore>
        <StatsGrid>
          <StatBlock>
            <StatValue>{accuracy}%</StatValue>
            <StatLabel>Accuracy</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatValue>x{g.maxCombo}</StatValue>
            <StatLabel>Max Combo</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatValue>{wpm}</StatValue>
            <StatLabel>WPM</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatValue>{g.totalMiss}</StatValue>
            <StatLabel>Missed Chars</StatLabel>
          </StatBlock>
        </StatsGrid>
        {isUploadingScore ? (
          <PreviewHint>Uploading score...</PreviewHint>
        ) : isUploadFlowComplete ? (
          <ScoreLeaderboard chartId={chartId} />
        ) : null}
        <ActionRow>
          <PlayAgainBtn onClick={onPlayAgain}>Play Again</PlayAgainBtn>
          <HomeBtn onClick={() => router.push("/")}>Home</HomeBtn>
        </ActionRow>
      </ResultsCard>
    </ResultsOverlay>
  );
}
