import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnimationDriverProps {
  scene: THREE.Group;
  clips: THREE.AnimationClip[];
  activeClipName: string | null;
  isPlaying: boolean;
  playbackSpeed: number;
  /** Called every frame with (currentTime, duration) */
  onTimeUpdate: (currentTime: number, duration: number) => void;
  /** Seek to a specific time (0..duration) */
  seekTo: number | null;
  onSeekConsumed: () => void;
}

/**
 * Lives *inside* a <Canvas> — drives THREE.AnimationMixer each frame.
 */
export const AnimationDriver: React.FC<AnimationDriverProps> = ({
  scene,
  clips,
  activeClipName,
  isPlaying,
  playbackSpeed,
  onTimeUpdate,
  seekTo,
  onSeekConsumed,
}) => {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const activeClipRef = useRef<string | null>(null);

  // Create or recreate mixer when scene changes
  useEffect(() => {
    mixerRef.current = new THREE.AnimationMixer(scene);
    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
    };
  }, [scene]);

  // Switch active clip
  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer || !clips.length) return;

    if (actionRef.current) {
      actionRef.current.stop();
      actionRef.current = null;
    }

    if (!activeClipName) return;

    const clip = THREE.AnimationClip.findByName(clips, activeClipName);
    if (!clip) return;

    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.timeScale = playbackSpeed;
    action.play();
    if (!isPlaying) action.paused = true;
    actionRef.current = action;
    activeClipRef.current = activeClipName;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClipName, clips]);

  // Sync play/pause
  useEffect(() => {
    if (!actionRef.current) return;
    actionRef.current.paused = !isPlaying;
    if (isPlaying && !actionRef.current.isRunning()) {
      actionRef.current.play();
    }
  }, [isPlaying]);

  // Sync speed
  useEffect(() => {
    if (actionRef.current) actionRef.current.timeScale = playbackSpeed;
  }, [playbackSpeed]);

  // Seek
  useEffect(() => {
    if (seekTo === null || !actionRef.current) return;
    actionRef.current.time = seekTo;
    mixerRef.current?.update(0);
    onSeekConsumed();
  }, [seekTo, onSeekConsumed]);

  useFrame((_, delta) => {
    if (!mixerRef.current) return;
    if (isPlaying) mixerRef.current.update(delta);

    if (actionRef.current) {
      const clip = actionRef.current.getClip();
      onTimeUpdate(actionRef.current.time % clip.duration, clip.duration);
    }
  });

  return null;
};
