'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameLoop } from '../engine/GameLoop';
import { Renderer } from '../engine/Renderer';
import { applyPhysics } from '../engine/Physics';
import { resolveStaticCollision, aabbOverlap } from '../engine/Collision';
import { createPlayer, applyInput, respawnAtCheckpoint, createInputState, type Player, type InputState } from '../entities/Player';
import { updateMovingPlatform } from '../entities/Interactables';
import { createStickyRushLevel, type LevelData } from '../levels/StickyRushLevel';
import { SyncManager, type PlayerSyncPayload, type GameEventPayload } from '../multiplayer/SyncManager';
import { createGame, joinGame, startGame, finishGame } from '@/app/actions/game';
import { sendMessageServer } from '@/app/actions/chat';
import { sfx } from '../engine/Audio';

type GamePhase = 'menu' | 'lobby' | 'character_select' | 'countdown' | 'playing' | 'finished';

interface StickyRushBoardProps {
  conversationId: string;
  userId: string;
  userName: string;
  partnerName: string;
  channelRef: React.MutableRefObject<any>;
  initialGameId?: string;
  onClose: () => void;
}

export default function StickyRushBoard({
  conversationId,
  userId,
  userName,
  partnerName,
  channelRef,
  initialGameId,
  onClose,
}: StickyRushBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const syncRef = useRef<SyncManager | null>(null);
  const levelRef = useRef<LevelData | null>(null);
  const localPlayerRef = useRef<Player | null>(null);
  const remotePlayerRef = useRef<Player | null>(null);
  const inputRef = useRef<InputState>(createInputState());
  const rendererRef = useRef<Renderer | null>(null);
  const elapsedRef = useRef(0);
  const gameTimeRef = useRef(0);
  const gameIdRef = useRef<string | null>(initialGameId || null);
  const isPlayer1Ref = useRef(true);
  const isMobileRef = useRef(false);

  // States for render
  const [gameId, setGameId] = useState<string | null>(initialGameId || null);
  const [isPlayer1, setIsPlayer1] = useState(true);

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [countdown, setCountdown] = useState(3);
  const [localCharacter, setLocalCharacter] = useState<'male' | 'female'>('male');
  const [remoteCharacter, setRemoteCharacter] = useState<'male' | 'female'>('female');
  const [localReady, setLocalReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [winner, setWinner] = useState<{ name: string; isLocal: boolean; time: number } | null>(null);
  const [partnerTime, setPartnerTime] = useState<number | null>(null);

  // ─── Detect mobile ───
  useEffect(() => {
    isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  }, []);

  // ─── Keyboard input ───
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      switch (e.key) {
        case 'a': case 'A': case 'ArrowLeft': inp.left = true; break;
        case 'd': case 'D': case 'ArrowRight': inp.right = true; break;
        case 'w': case 'W': case 'ArrowUp': case ' ': inp.jump = true; e.preventDefault(); break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      switch (e.key) {
        case 'a': case 'A': case 'ArrowLeft': inp.left = false; break;
        case 'd': case 'D': case 'ArrowRight': inp.right = false; break;
        case 'w': case 'W': case 'ArrowUp': case ' ': inp.jump = false; break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ─── Touch controls ───
  const handleTouchControl = useCallback((action: 'left' | 'right' | 'jump', pressed: boolean) => {
    const inp = inputRef.current;
    inp[action] = pressed;
  }, []);

  // ─── Create game (host) ───
  const handleCreateGame = async () => {
    sfx.init();
    sfx.playClick();
    const result = await createGame(conversationId);
    if (!result.success || !result.gameId) return;
    gameIdRef.current = result.gameId;
    setGameId(result.gameId);
    isPlayer1Ref.current = true;
    setIsPlayer1(true);
    setPhase('lobby');

    // Send game invite via chat database so it persists and is delivered
    await sendMessageServer(
      conversationId,
      JSON.stringify({ type: 'game_invite', gameId: result.gameId, gameName: 'Sticky Rush' }),
      'image'
    );

    // Listen for partner join
    setupSyncListeners();
  };

  // ─── Join game (partner) ───
  const handleJoinGame = async (gameId: string) => {
    sfx.init();
    sfx.playClick();
    const result = await joinGame(gameId);
    if (!result.success) return;
    gameIdRef.current = gameId;
    setGameId(gameId);
    isPlayer1Ref.current = false;
    setIsPlayer1(false);
    setPhase('character_select');
    setupSyncListeners();

    // Notify host that we joined
    syncRef.current?.sendGameEvent({ type: 'game_start', data: { playerId: userId } });
  };

  // ─── Setup sync listeners on existing channel ───
  const setupSyncListeners = () => {
    if (!channelRef.current) return;
    const sync = new SyncManager(channelRef.current);
    syncRef.current = sync;

    sync.listen(
      // Remote player position update
      (payload: PlayerSyncPayload) => {
        if (payload.id === userId) return; // ignore own echoes
        const remote = remotePlayerRef.current;
        if (remote) {
          SyncManager.interpolateRemote(remote, payload);
        }
      },
      // Game events
      (event: GameEventPayload) => {
        switch (event.type) {
          case 'game_start':
            // Partner joined — go to character select
            setPhase('character_select');
            break;
          case 'character_ready':
            setRemoteCharacter(event.data.character);
            setRemoteReady(true);
            if (isPlayer1Ref.current && localReady) {
              startCountdown();
            }
            break;
          case 'game_countdown':
            setPhase('countdown');
            setCountdown(event.data.count);
            if (event.data.count <= 0) {
              setPhase('playing');
              setTimeout(() => {
                if (!gameLoopRef.current) initGameWorld();
              }, 50);
            }
            break;
          case 'interactable':
            // Update interactable state
            if (levelRef.current) {
              const item = levelRef.current.interactables.find(i => i.id === event.data.id);
              if (item) item.activated = event.data.activated;
              // Also update linked items
              if (event.data.linkedId) {
                const linked = levelRef.current.interactables.find(i => i.id === event.data.linkedId);
                if (linked) linked.activated = event.data.activated;
              }
            }
            break;
          case 'checkpoint':
            // Update checkpoint
            if (levelRef.current) {
              const cp = levelRef.current.checkpoints.find(c => c.id === event.data.id);
              if (cp) cp.reached = true;
            }
            break;
          case 'finish':
            handleRemoteFinish(event.data);
            break;
        }
      }
    );
  };

  // ─── Character Select ───
  const handleCharacterSelectReady = () => {
    sfx.playClick();
    setLocalReady(true);
    syncRef.current?.sendGameEvent({ type: 'character_ready', data: { character: localCharacter } });
    if (isPlayer1Ref.current && remoteReady) {
      startCountdown();
    }
  };

  // ─── Countdown ───
  const startCountdown = async () => {
    if (gameIdRef.current) {
      await startGame(gameIdRef.current);
    }

    setPhase('countdown');
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      syncRef.current?.sendGameEvent({ type: 'game_countdown', data: { count } });
      if (count <= 0) {
        clearInterval(interval);
        setPhase('playing');
        setTimeout(() => {
          if (!gameLoopRef.current) initGameWorld();
        }, 50);
      }
    }, 1000);
  };

  // ─── Init game world ───
  const initGameWorld = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const level = createStickyRushLevel();
    levelRef.current = level;

    const local = createPlayer(userId, userName, localCharacter, isPlayer1Ref.current, level.spawnX, level.spawnY);
    localPlayerRef.current = local;

    const remote = createPlayer('remote', partnerName, remoteCharacter, !isPlayer1Ref.current, level.spawnX, level.spawnY);
    remotePlayerRef.current = remote;

    // Canvas sizing
    const container = canvas.parentElement;
    const w = container?.clientWidth || 800;
    const h = container?.clientHeight || 500;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d')!;
    const renderer = new Renderer(ctx, w, h);
    rendererRef.current = renderer;

    elapsedRef.current = 0;
    gameTimeRef.current = performance.now() / 1000;

    // Start broadcasting
    syncRef.current?.startBroadcasting(local);

    // ─── Game Loop ───
    const gameLoop = new GameLoop(
      ctx,
      // UPDATE
      (dt: number) => {
        if (!levelRef.current || !localPlayerRef.current) return;
        const lp = localPlayerRef.current;
        const lvl = levelRef.current;
        const now = performance.now() / 1000;

        elapsedRef.current = now - gameTimeRef.current;

        // Skip physics for finished player
        if (lp.finished) return;

        // Apply input
        applyInput(lp, inputRef.current);

        // Apply physics
        applyPhysics(lp.body, dt);

        // Update moving platforms
        for (const p of lvl.platforms) {
          updateMovingPlatform(p, now);
        }

        // Collision with platforms
        for (const p of lvl.platforms) {
          resolveStaticCollision(lp.body, p);
        }

        // Collision with closed doors
        for (const item of lvl.interactables) {
          if (item.type === 'door' && !item.activated) {
            resolveStaticCollision(lp.body, item);
          }
        }

        // ─── Interactable Logic ───
        for (const item of lvl.interactables) {
          if (item.type === 'button') {
            const wasActivated = item.activated;
            item.activated = aabbOverlap(lp.body, item);
            if (item.activated !== wasActivated) {
              if (item.activated) sfx.playClick();
              // Toggle linked door
              const linked = lvl.interactables.find(i => i.id === item.linkedId);
              if (linked) linked.activated = item.activated;
              syncRef.current?.sendGameEvent({
                type: 'interactable',
                data: { id: item.id, activated: item.activated, linkedId: item.linkedId }
              });
            }
          }

          if (item.type === 'key' && !item.activated && !lp.hasKey) {
            if (aabbOverlap(lp.body, item)) {
              item.activated = true;
              lp.hasKey = true;
              sfx.playPickup();
              // Open linked door
              const linked = lvl.interactables.find(i => i.id === item.linkedId);
              if (linked) linked.activated = true;
              syncRef.current?.sendGameEvent({
                type: 'interactable',
                data: { id: item.id, activated: true, linkedId: item.linkedId }
              });
            }
          }

          if (item.type === 'lever' && !item.activated) {
            if (aabbOverlap(lp.body, item)) {
              item.activated = true;
              sfx.playClick();
              const linked = lvl.interactables.find(i => i.id === item.linkedId);
              if (linked) linked.activated = true;
              syncRef.current?.sendGameEvent({
                type: 'interactable',
                data: { id: item.id, activated: true, linkedId: item.linkedId }
              });
            }
          }
        }

        // Checkpoints
        for (const cp of lvl.checkpoints) {
          if (!cp.reached && aabbOverlap(lp.body, cp)) {
            cp.reached = true;
            lp.lastCheckpointX = cp.x;
            lp.lastCheckpointY = cp.y - 10;
            syncRef.current?.sendGameEvent({
              type: 'checkpoint',
              data: { id: cp.id }
            });
          }
        }

        // Finish line
        if (aabbOverlap(lp.body, lvl.finishLine) && !lp.finished) {
          lp.finished = true;
          lp.finishTime = elapsedRef.current;
          lp.state = 'victory';
          sfx.playWin();
          handleLocalFinish();
        }

        // Death (fall off)
        if (lp.body.y > lvl.deathY) {
          sfx.playDeath();
          respawnAtCheckpoint(lp);
        }
      },
      // RENDER
      (ctx: CanvasRenderingContext2D) => {
        if (!rendererRef.current || !localPlayerRef.current || !levelRef.current) return;
        const r = rendererRef.current;
        const lp = localPlayerRef.current;
        const rp = remotePlayerRef.current;
        const lvl = levelRef.current;

        // Camera follows local player
        const camX = Math.max(0, Math.min(lp.body.x - canvas.width / 3, lvl.width - canvas.width));
        const camY = Math.max(0, Math.min(lp.body.y - canvas.height / 2, lvl.height - canvas.height));

        r.clear();
        r.drawBackground(camX);

        // Draw platforms
        for (const p of lvl.platforms) {
          r.drawPlatform(p, camX, camY);
        }

        // Draw interactables
        for (const item of lvl.interactables) {
          r.drawInteractable(item, camX, camY);
        }

        // Draw checkpoints
        for (const cp of lvl.checkpoints) {
          r.drawCheckpoint(cp, camX, camY);
        }

        // Draw finish line
        r.drawFinishLine(lvl.finishLine, camX, camY);

        // Draw remote player (behind local)
        if (rp) r.drawPlayer(rp, camX, camY, false);

        // Draw local player
        r.drawPlayer(lp, camX, camY, true);

        // HUD
        r.drawHUD(lp, rp, elapsedRef.current, lvl.width);

        // Mobile controls
        if (isMobileRef.current) {
          r.drawMobileControls(canvas.width, canvas.height);
        }
      }
    );

    gameLoopRef.current = gameLoop;
    setPhase('playing');
    gameLoop.start();
  };

  // ─── Handle local player finishing ───
  const handleLocalFinish = async () => {
    const time = elapsedRef.current;
    syncRef.current?.sendGameEvent({
      type: 'finish',
      data: { playerId: userId, playerName: userName, time }
    });

    if (gameIdRef.current) {
      await finishGame(gameIdRef.current, userId, time);
    }

    setWinner({ name: userName, isLocal: true, time });
    setPhase('finished');
    setTimeout(() => {
      gameLoopRef.current?.stop();
      syncRef.current?.stop();
    }, 2000);
  };

  // ─── Handle remote player finishing ───
  const handleRemoteFinish = (data: any) => {
    if (winner) return; // Already have a winner

    const remote = remotePlayerRef.current;
    if (remote) {
      remote.finished = true;
      remote.finishTime = data.time;
      remote.state = 'victory';
    }

    setWinner({ name: data.playerName, isLocal: false, time: data.time });
    setPartnerTime(data.time);
    setPhase('finished');
    setTimeout(() => {
      gameLoopRef.current?.stop();
      syncRef.current?.stop();
    }, 2000);
  };

  // ─── Canvas touch handler for mobile ───
  const handleCanvasTouch = useCallback((e: React.TouchEvent, pressed: boolean) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const btnSize = 52;
    const margin = 16;
    const bottomY = canvas.height - btnSize - margin - 20;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const tx = touch.clientX - rect.left;
      const ty = touch.clientY - rect.top;

      // Left button zone
      if (tx < margin + btnSize + 6 && ty > bottomY - 10) {
        handleTouchControl('left', pressed);
      }
      // Right button zone
      else if (tx > margin + btnSize + 6 && tx < margin + btnSize * 2 + 18 && ty > bottomY - 10) {
        handleTouchControl('right', pressed);
      }
      // Jump button zone
      else if (tx > canvas.width - margin - btnSize - 10 && ty > bottomY - 10) {
        handleTouchControl('jump', pressed);
      }
    }
  }, [handleTouchControl]);

  // ─── Cleanup ───
  useEffect(() => {
    return () => {
      gameLoopRef.current?.stop();
      syncRef.current?.stop();
    };
  }, []);

  // ─── Handle resize ───
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      rendererRef.current?.resize(canvas.width, canvas.height);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Listen for game invites from partner ───
  useEffect(() => {
    if (!channelRef.current) return;
    const handler = (msg: any) => {
      try {
        const content = JSON.parse(msg.payload?.content || '{}');
        if (content.type === 'game_invite' && msg.payload?.sender_id !== userId) {
          // Auto-show join prompt
          gameIdRef.current = content.gameId;
        }
      } catch {}
    };
    channelRef.current.on('broadcast', { event: 'new_message' }, handler);
  }, [channelRef, userId]);

  // ═══ RENDER ═══
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-0">
      {/* ─── Menu ─── */}
      {phase === 'menu' && (
        <div className="flex flex-col items-center gap-6 text-center px-6 animate-in fade-in duration-300">
          <div className="text-5xl">🎮</div>
          <h2 className="text-white text-2xl font-bold tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            Sticky Rush
          </h2>
          <p className="text-white/60 text-sm max-w-xs">
            Two players. One course. First to the finish wins.
          </p>
          <button
            onClick={handleCreateGame}
            className="px-8 py-3 bg-white text-black font-bold rounded-full text-base hover:scale-105 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            Invite Partner
          </button>

          {/* Show join option if an invite was received */}
          {gameId && (
            <button
              onClick={() => handleJoinGame(gameId!)}
              className="px-8 py-3 bg-[#f8bbd0] text-black font-bold rounded-full text-base hover:scale-105 active:scale-95 transition-transform"
            >
              Join Game
            </button>
          )}

          <button
            onClick={onClose}
            className="text-white/40 text-sm mt-4 hover:text-white/60 transition-colors"
          >
            Back to chat
          </button>
        </div>
      )}

      {/* ─── Lobby ─── */}
      {phase === 'lobby' && (
        <div className="flex flex-col items-center gap-6 text-center px-6 animate-in fade-in duration-300">
          <h2 className="text-white text-xl font-bold tracking-tight">STICKY RUSH</h2>
          <div className="flex items-center gap-8">
            {/* Player 1 sticky */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-[#fff59d] rounded-sm shadow-lg flex items-center justify-center text-2xl">
                😊
              </div>
              <span className="text-white text-xs font-medium">
                {isPlayer1 ? userName : partnerName}
              </span>
              <span className="text-green-400 text-xs">✓ Ready</span>
            </div>

            <span className="text-white/30 text-xl">vs</span>

            {/* Player 2 sticky */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-[#f8bbd0] rounded-sm shadow-lg flex items-center justify-center text-2xl opacity-40">
                😊
              </div>
              <span className="text-white/40 text-xs font-medium">
                {isPlayer1 ? partnerName : userName}
              </span>
              <span className="text-white/40 text-xs">Waiting...</span>
            </div>
          </div>
          <p className="text-white/40 text-sm mt-4 animate-pulse">
            Waiting for {isPlayer1 ? partnerName : userName} to join...
          </p>
        </div>
      )}

      {/* ─── Character Select ─── */}
      {phase === 'character_select' && (
        <div className="flex flex-col items-center gap-6 text-center px-6 animate-in fade-in duration-300">
          <h2 className="text-white text-xl font-bold tracking-tight">CHOOSE CHARACTER</h2>
          
          <div className="flex gap-4">
            <button
              onClick={() => { if (!localReady) setLocalCharacter('male'); sfx.playClick(); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${localCharacter === 'male' ? 'border-blue-400 bg-blue-500/20 scale-105' : 'border-white/10 bg-black/20 opacity-60'} ${localReady ? 'pointer-events-none opacity-50' : ''}`}
            >
              <div className="w-16 h-16 bg-[#bbdefb] rounded-sm shadow-lg flex items-center justify-center text-2xl">
                👦
              </div>
              <span className="text-white text-xs font-bold">Boy</span>
            </button>

            <button
              onClick={() => { if (!localReady) setLocalCharacter('female'); sfx.playClick(); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${localCharacter === 'female' ? 'border-pink-400 bg-pink-500/20 scale-105' : 'border-white/10 bg-black/20 opacity-60'} ${localReady ? 'pointer-events-none opacity-50' : ''}`}
            >
              <div className="w-16 h-16 bg-[#f8bbd0] rounded-sm shadow-lg flex items-center justify-center text-2xl">
                👧
              </div>
              <span className="text-white text-xs font-bold">Girl</span>
            </button>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            {!localReady ? (
              <button
                onClick={handleCharacterSelectReady}
                className="px-8 py-3 bg-white text-black font-bold rounded-full text-base hover:scale-105 active:scale-95 transition-transform"
              >
                Ready
              </button>
            ) : (
              <div className="text-green-400 font-bold px-8 py-3">✓ You are Ready</div>
            )}
            
            <div className="text-white/50 text-sm h-6">
              {remoteReady ? `✓ ${partnerName} is Ready` : `Waiting for ${partnerName}...`}
            </div>
          </div>
        </div>
      )}

      {/* ─── Countdown ─── */}
      {phase === 'countdown' && (
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <h2 className="text-white text-xl font-bold tracking-tight">STICKY RUSH</h2>
          <div className="text-white text-8xl font-black animate-in zoom-in duration-300" key={countdown}>
            {countdown > 0 ? countdown : 'GO!'}
          </div>
        </div>
      )}

      {/* ─── Game Canvas ─── */}
      {(phase === 'playing' || phase === 'finished') && (
        <div className="w-full h-full relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full block touch-none"
            onTouchStart={(e) => handleCanvasTouch(e, true)}
            onTouchEnd={(e) => handleCanvasTouch(e, false)}
            onTouchCancel={(e) => handleCanvasTouch(e, false)}
          />
        </div>
      )}

      {/* ─── Result Overlay ─── */}
      {phase === 'finished' && winner && (
        <div className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500 px-6">
          <h2 className="text-white text-xl font-bold tracking-wider">STICKY RUSH</h2>
          <div className="text-6xl">{winner.isLocal ? '🏆' : '💕'}</div>
          <h3 className="text-white text-3xl font-black">
            {winner.isLocal ? 'YOU WIN!' : `${winner.name} WINS!`}
          </h3>
          <div className="flex flex-col gap-1 text-center">
            <p className="text-white/70 text-sm">
              {winner.isLocal ? 'Your' : 'Their'} time: {formatTime(winner.time)}
            </p>
            {partnerTime && (
              <p className="text-white/50 text-xs">
                {winner.isLocal ? 'Partner' : 'You'}: {formatTime(partnerTime)}
              </p>
            )}
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => {
                setPhase('menu');
                setWinner(null);
                setPartnerTime(null);
              }}
              className="px-6 py-2.5 bg-white text-black font-bold rounded-full text-sm hover:scale-105 active:scale-95 transition-transform"
            >
              Play Again
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-white/30 text-white font-medium rounded-full text-sm hover:bg-white/10 active:scale-95 transition-all"
            >
              Back to Chat
            </button>
          </div>
        </div>
      )}

      {/* ─── Close button (always visible) ─── */}
      {phase !== 'finished' && (
        <button
          onClick={() => {
            gameLoopRef.current?.stop();
            syncRef.current?.stop();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Close game"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
