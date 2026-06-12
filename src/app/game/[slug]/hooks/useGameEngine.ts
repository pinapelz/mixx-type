"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import pb from "../../../lib/pocketbase";
import { gReducer, initialGState, GState } from "../game.stat";
import {
  parseLrcLines,
  GameLine,
  formatTime,
  calculateCPSNeeded,
} from "../game.utils";

export type GamePhase = "idle" | "countdown" | "playing" | "paused" | "finished";

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "ogv"]);

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const cleaned = url.split("?")[0].split("#")[0];
  const ext = cleaned.split(".").pop()?.toLowerCase();
  return !!ext && VIDEO_EXTENSIONS.has(ext);
}

const BACKGROUND_OPACITY_KEY = "lrcType.backgroundOpacity";
const AUDIO_VOLUME_KEY = "lrcType.audioVolume";

export interface GameEngineResult {
  // refs
  audioRef: React.RefObject<HTMLAudioElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  charRowRef: React.MutableRefObject<HTMLDivElement | null>;
  charRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>;

  // playback / timing state
  phase: GamePhase;
  currentMs: number;
  duration: number;
  progressPct: number;
  gameDurationMs: number;
  countdown: number;
  lineTimingPct: number;
  lineRemainingMs: number;
  currentLineTime: number;

  // song metadata & content
  lrcContent: string;
  audioUrl: string;
  songTitle: string;
  songArtist: string;
  chartId: string | null;
  offset: number;
  loadingLrc: boolean;

  // game logic
  g: GState;
  gameLines: GameLine[];
  isReady: boolean;
  accuracy: number;
  wpm: number;

  // visual feedback
  wrongChar: boolean;
  clearShowing: boolean;
  comboAnimKey: number;
  wrapSpaceIndicators: boolean[];

  // settings
  backgroundOpacity: number;
  setBackgroundOpacity: React.Dispatch<React.SetStateAction<number>>;
  audioVolume: number;
  setAudioVolume: React.Dispatch<React.SetStateAction<number>>;

  // preview / misc
  isPreviewPlaying: boolean;
  skipBacking: boolean;
  isVideo: boolean;
  intermissionData: { pct: number; remainingMs: number };
  endingIntermissionData: { canSkip: boolean; remainingMs: number };

  // handlers
  handleStart: () => void;
  handleRestart: () => void;
  handlePreviewToggle: () => void;

  // navigation
  router: ReturnType<typeof useRouter>;

  // helpers (forwarded for consumers that need them)
  formatTime: typeof formatTime;
  calculateCPSNeeded: typeof calculateCPSNeeded;
}

export function useGameEngine(): GameEngineResult {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gameStartTimeRef = useRef<number>(0);
  const lastHandledIdxRef = useRef(-1);
  const lastLineAdvanceAtRef = useRef(0);

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [currentMs, setCurrentMs] = useState(0);
  const [lineTimingPct, setLineTimingPct] = useState(0);
  const [lineRemainingMs, setLineRemainingMs] = useState(0);
  const [currentLineTime, setCurrentLineTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [gameDurationMs, setGameDurationMs] = useState(0);

  const [lrcContent, setLrcContent] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [songTitle, setSongTitle] = useState("Unknown Title");
  const [songArtist, setSongArtist] = useState("Unknown Artist");
  const [chartId, setChartId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [loadingLrc, setLoadingLrc] = useState(false);

  const [wrongChar, setWrongChar] = useState(false);
  const [clearShowing, setClearShowing] = useState(false);
  const [comboAnimKey, setComboAnimKey] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0);
  const [audioVolume, setAudioVolume] = useState(100);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [skipBacking, setSkipBacking] = useState(false);
  const isVideo = useMemo(() => isVideoUrl(audioUrl), [audioUrl]);

  useEffect(() => {
    const storedOpacity = localStorage.getItem(BACKGROUND_OPACITY_KEY);
    if (storedOpacity !== null) {
      const parsed = Number(storedOpacity);
      if (Number.isFinite(parsed)) setBackgroundOpacity(Math.min(100, Math.max(0, parsed)));
    }
    const storedVolume = localStorage.getItem(AUDIO_VOLUME_KEY);
    if (storedVolume !== null) {
      const parsed = Number(storedVolume);
      if (Number.isFinite(parsed)) setAudioVolume(Math.min(100, Math.max(0, parsed)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(BACKGROUND_OPACITY_KEY, String(backgroundOpacity));
  }, [backgroundOpacity]);

  useEffect(() => {
    localStorage.setItem(AUDIO_VOLUME_KEY, String(audioVolume));
  }, [audioVolume]);

  useEffect(() => {
    const media = isVideo ? videoRef.current : audioRef.current;
    if (!media) return;
    media.volume = audioVolume / 100;
  }, [audioVolume, isVideo, audioUrl]);

  useEffect(() => {
    const media = isVideo ? videoRef.current : audioRef.current;
    if (!media) { setIsPreviewPlaying(false); return; }
    const handlePlay = () => setIsPreviewPlaying(true);
    const handlePause = () => setIsPreviewPlaying(false);
    const handleEnded = () => setIsPreviewPlaying(false);
    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);
    media.addEventListener("ended", handleEnded);
    return () => {
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
      media.removeEventListener("ended", handleEnded);
    };
  }, [isVideo, audioUrl]);

  useEffect(() => { setIsPreviewPlaying(false); }, [audioUrl]);

  const charRowRef = useRef<HTMLDivElement | null>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [wrapSpaceIndicators, setWrapSpaceIndicators] = useState<boolean[]>([]);
  const countdownIntervalRef = useRef<number | null>(null);

  const [g, dispatch] = useReducer(gReducer, initialGState);

  const gameLines = useMemo(() => parseLrcLines(lrcContent, { skipBacking }), [lrcContent, skipBacking]);
  const isReady = !loadingLrc && !!lrcContent && !!audioUrl;

  const accuracy = g.totalCorrect + g.totalMiss > 0
    ? Math.round((g.totalCorrect / (g.totalCorrect + g.totalMiss)) * 100)
    : 100;

  const elapsedMs = phase === "playing"
    ? Math.max(1, Date.now() - gameStartTimeRef.current)
    : gameDurationMs;

  const wpm = elapsedMs > 0 ? Math.round(g.totalCorrect / 5 / (elapsedMs / 60000)) : 0;

  const gRef = useRef(g);
  const currentLineContent = g.displayedLineIdx >= 0 ? (gameLines[g.displayedLineIdx]?.content ?? "") : "";

  useEffect(() => { charRefs.current = []; }, [currentLineContent]);

  useLayoutEffect(() => {
    if (!charRowRef.current) return;
    let frame = 0;
    const text = currentLineContent.toLowerCase();
    const recompute = () => {
      const nodes = charRefs.current;
      const indicators = new Array(text.length).fill(false);
      for (let i = 0; i < text.length - 1; i += 1) {
        if (text[i] !== " ") continue;
        const curr = nodes[i];
        const next = nodes[i + 1];
        if (!curr || !next) continue;
        const currRect = curr.getBoundingClientRect();
        const nextRect = next.getBoundingClientRect();
        if (nextRect.top - currRect.top > 1) indicators[i] = true;
      }
      setWrapSpaceIndicators(indicators);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(recompute);
      });
    };
    schedule();
    if (document.fonts?.ready) document.fonts.ready.then(schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(charRowRef.current);
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [currentLineContent]);

  useEffect(() => { gRef.current = g; }, [g]);

  const phaseRef = useRef<GamePhase>("idle");
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const offsetRef = useRef(0);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const mediaSession = navigator.mediaSession;
    mediaSession.setActionHandler("pause", () => {});
    return () => { mediaSession.setActionHandler("pause", null); };
  }, []);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  const lineAnimRef = useRef({ startMs: 0, endMs: 0, startPerf: 0 });

  const timeBasedLineIdx = useMemo(() => {
    if (!gameLines.length) return -1;
    let idx = -1;
    for (let i = 0; i < gameLines.length; i++) {
      if (gameLines[i].millisecond <= currentMs) idx = i;
      else break;
    }
    return idx;
  }, [currentMs, gameLines]);

  const intermissionData = useMemo(() => {
    const firstMs = gameLines[0]?.millisecond ?? 0;
    const firstMediaMs = firstMs - offsetRef.current;
    const remainingMs = Math.max(0, firstMs - currentMs);
    if (!gameLines.length || firstMediaMs <= 0) return { pct: remainingMs === 0 ? 100 : 0, remainingMs };
    const mediaCurrentMs = currentMs - offsetRef.current;
    const pct = Math.min(100, Math.max(0, (mediaCurrentMs / firstMediaMs) * 100));
    return { pct, remainingMs };
  }, [gameLines, currentMs, offset]); // eslint-disable-line react-hooks/exhaustive-deps

  const endingIntermissionData = useMemo(() => {
    const lastIdx = gameLines.length - 1;
    if (lastIdx < 0 || phase !== "playing") return { canSkip: false, remainingMs: 0 };

    const isAtOrPastLastLine = g.displayedLineIdx >= lastIdx;
    if (!isAtOrPastLastLine) return { canSkip: false, remainingMs: 0 };

    const lastLine = gameLines[lastIdx];
    const inEndingIntermission = g.lineCompleted || (lastLine?.content.trim() ?? "") === "";
    if (!inEndingIntermission) return { canSkip: false, remainingMs: 0 };

    const mediaCurrentMs = Math.max(0, currentMs - offset);
    const remainingMs = Math.max(0, duration - mediaCurrentMs);
    return { canSkip: remainingMs > 5000, remainingMs };
  }, [gameLines, phase, g.displayedLineIdx, g.lineCompleted, currentMs, duration, offset]);

  useEffect(() => {
    const idx = g.displayedLineIdx;
    if (idx < 0 || !gameLines[idx]) {
      lineAnimRef.current = { startMs: 0, endMs: 0, startPerf: 0 };
      setLineTimingPct(0);
      setLineRemainingMs(0);
      setCurrentLineTime(-1);
      return;
    }
    const start = gameLines[idx].millisecond;
    const end = gameLines[idx + 1]?.millisecond ?? start + 5000;
    lineAnimRef.current = { startMs: start, endMs: end, startPerf: performance.now() };
    setLineTimingPct(0);
    const currentLineTime = end - start;
    setLineRemainingMs(Math.max(0, currentLineTime));
    setCurrentLineTime(Math.max(currentLineTime, currentLineTime));
  }, [g.displayedLineIdx, gameLines]);

  useEffect(() => {
    if (phase !== "playing") return;
    let rafId = 0;
    const tick = () => {
      const { startMs, endMs, startPerf } = lineAnimRef.current;
      if (endMs <= startMs) {
        setLineTimingPct(100);
        setLineRemainingMs(0);
      } else {
        const elapsed = performance.now() - startPerf;
        const duration = endMs - startMs;
        const pct = Math.min(100, Math.max(0, (elapsed / duration) * 100));
        const remaining = Math.max(0, duration - elapsed);
        setLineTimingPct(pct);
        setLineRemainingMs(remaining);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [phase]);

  useEffect(() => {
    const media = isVideo ? videoRef.current : audioRef.current;
    if (!media) return;
    const onTimeUpdate = () => {
      setCurrentMs(media.currentTime * 1000 + offsetRef.current);
      if (media.duration && !isNaN(media.duration)) {
        setDuration(media.duration * 1000);
        setProgressPct((media.currentTime / media.duration) * 100);
      }
    };
    const onLoadedMetadata = () => {
      if (!isNaN(media.duration)) {
        setDuration(media.duration * 1000);
        setGameDurationMs(media.duration * 1000);
      }
    };
    const onEnded = () => {
      if (phaseRef.current === "playing") {
        setPhase("finished");
        setGameDurationMs(Date.now() - gameStartTimeRef.current);
        return;
      }
      setIsPreviewPlaying(false);
    };
    media.addEventListener("timeupdate", onTimeUpdate);
    media.addEventListener("loadedmetadata", onLoadedMetadata);
    media.addEventListener("ended", onEnded);
    return () => {
      media.removeEventListener("timeupdate", onTimeUpdate);
      media.removeEventListener("loadedmetadata", onLoadedMetadata);
      media.removeEventListener("ended", onEnded);
    };
  }, [isVideo, audioUrl]);

  useEffect(() => {
    if (phaseRef.current !== "playing") return;
    if (timeBasedLineIdx < 0) return;
    if (timeBasedLineIdx <= lastHandledIdxRef.current) return;
    lastHandledIdxRef.current = timeBasedLineIdx;
    lastLineAdvanceAtRef.current = performance.now();
    dispatch({ type: "ADVANCE", newIdx: timeBasedLineIdx, prevCompleted: gRef.current.lineCompleted });
  }, [timeBasedLineIdx]);

  const loadData = useCallback((data: Record<string, unknown>) => {
    if (typeof data.lrc === "string" && data.lrc) {
      setLoadingLrc(true);
      fetch(data.lrc)
        .then((r) => r.text())
        .then((t) => { setLrcContent(t); setLoadingLrc(false); });
    }
    if (typeof data.media === "string") setAudioUrl(data.media);
    if (typeof data.offset === "number") setOffset(data.offset);
    if (typeof data.offset === "string" && data.offset.trim() !== "") setOffset(Number(data.offset));
    if (typeof data.title === "string") setSongTitle(data.title);
    if (typeof data.artist === "string") setSongArtist(data.artist);
    if (typeof data.skip_backing === "boolean") setSkipBacking(data.skip_backing);
    if (typeof data.skip_backing === "string") setSkipBacking(data.skip_backing === "true");
  }, []);

  useEffect(() => {
    if (!slug) return;
    pb.collection("charts")
      .getOne(slug)
      .then((record) => {
        setChartId(record.id);
        loadData({
          media: (record as Record<string, unknown>).media,
          lrc: (record as Record<string, unknown>).lrc,
          offset: (record as Record<string, unknown>).offset,
          title: (record as Record<string, unknown>).title,
          artist: (record as Record<string, unknown>).artist,
        });
      })
      .catch(() => {
        setChartId(null);
        try {
          const json = atob(slug);
          const data = JSON.parse(json) as Record<string, unknown>;
          loadData(data);
        } catch {}
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreviewToggle = useCallback(() => {
    if (phase !== "idle") return;
    const media = isVideo ? videoRef.current : audioRef.current;
    if (!media || !audioUrl) return;
    if (media.paused) {
      void media.play().catch(() => {
        toast.error("Unable to start preview. Try interacting with the page again.", { theme: "dark" });
      });
      return;
    }
    media.pause();
  }, [phase, isVideo, audioUrl]);

  const handleStart = useCallback(() => {
    const media = isVideo ? videoRef.current : audioRef.current;
    if (!media || !lrcContent || !audioUrl) return;
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    dispatch({ type: "RESET" });
    lastHandledIdxRef.current = -1;
    media.pause();
    media.currentTime = 0;
    setIsPreviewPlaying(false);
    setPhase("countdown");
    setCountdown(5);
    setGameDurationMs(0);
    setProgressPct(0);
    setCurrentMs(0);
    const beginPlayback = () => {
      media.currentTime = 0;
      media.play();
      setPhase("playing");
      gameStartTimeRef.current = Date.now();
    };
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownIntervalRef.current !== null) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          beginPlayback();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [lrcContent, audioUrl, gameLines, isVideo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestart = useCallback(() => {
    const media = isVideo ? videoRef.current : audioRef.current;
    if (media) { media.pause(); media.currentTime = 0; }
    setIsPreviewPlaying(false);
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(0);
    dispatch({ type: "RESET" });
    lastHandledIdxRef.current = -1;
    setPhase("idle");
    setCurrentMs(0);
    setProgressPct(0);
  }, [isVideo]);

  const handleKeyPress = useCallback((char: string) => {
    if (phaseRef.current !== "playing") return;
    const line = gameLines[gRef.current.displayedLineIdx];
    if (!line || gRef.current.lineCompleted) return;
    const expected = line.content[gRef.current.typedCount];
    if (expected === undefined) return;
    if (char.toLowerCase() === expected.toLowerCase()) {
      const willComplete = gRef.current.typedCount + 1 >= line.content.length;
      dispatch({ type: "CORRECT", willComplete });
      if (willComplete) {
        setClearShowing(true);
        setTimeout(() => setClearShowing(false), 700);
        setComboAnimKey((k) => k + 1);
      }
    } else {
      if (performance.now() - lastLineAdvanceAtRef.current < 100) return;
      dispatch({ type: "WRONG" });
      setWrongChar(true);
      setTimeout(() => setWrongChar(false), 320);
    }
  }, [gameLines]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") {
        const idx = gRef.current.displayedLineIdx;
        const media = isVideo ? videoRef.current : audioRef.current;

        if (idx < 0 && gameLines.length > 0 && media) {
          const firstMs = gameLines[0]?.millisecond ?? 0;
          const currentMsLocal = media.currentTime * 1000 + offsetRef.current;
          const intermissionRemaining = Math.max(0, firstMs - currentMsLocal);
          if (intermissionRemaining > 5000) {
            e.preventDefault();
            const targetMs = firstMs - 3000;
            media.currentTime = Math.max(0, (targetMs - offsetRef.current) / 1000);
            setCurrentMs(media.currentTime * 1000 + offsetRef.current);
            return;
          }
        }

        if (idx >= gameLines.length - 1 && gameLines.length > 0 && media) {
          const currentLine = gameLines[idx];
          const canSkipEndingIntermission =
            gRef.current.lineCompleted || (currentLine?.content.trim() ?? "") === "";

          if (canSkipEndingIntermission && Number.isFinite(media.duration) && media.duration > 0) {
            const remainingToEndMs = Math.max(0, media.duration * 1000 - media.currentTime * 1000);
            if (remainingToEndMs > 5000) {
              e.preventDefault();
              media.currentTime = Math.max(0, media.duration - 0.05);
              setCurrentMs(media.currentTime * 1000 + offsetRef.current);
              return;
            }
          }
        }
      }
      if (e.key.length === 1) {
        e.preventDefault();
        handleKeyPress(e.key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleKeyPress, gameLines, isVideo]);

  return {
    // refs
    audioRef,
    videoRef,
    charRowRef,
    charRefs,

    // playback / timing
    phase,
    currentMs,
    duration,
    progressPct,
    gameDurationMs,
    countdown,
    lineTimingPct,
    lineRemainingMs,
    currentLineTime,

    // song metadata & content
    lrcContent,
    audioUrl,
    songTitle,
    songArtist,
    chartId,
    offset,
    loadingLrc,

    // game logic
    g,
    gameLines,
    isReady,
    accuracy,
    wpm,

    // visual feedback
    wrongChar,
    clearShowing,
    comboAnimKey,
    wrapSpaceIndicators,

    // settings
    backgroundOpacity,
    setBackgroundOpacity,
    audioVolume,
    setAudioVolume,

    // preview / misc
    isPreviewPlaying,
    skipBacking,
    isVideo,
    intermissionData,
    endingIntermissionData,

    // handlers
    handleStart,
    handleRestart,
    handlePreviewToggle,

    // navigation
    router,

    // helpers
    formatTime,
    calculateCPSNeeded,
  };
}
