/* Upstream 5b5686d43e7cebd66632d1a3d860f37dd4b9ae2d
Copyright (c) 2026 NARBE LLC

This software and associated documentation files (the "Software") are licensed under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this Software to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the terms of the MIT License.

The above copyright notice and permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY ARISING FROM THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Use of the names "NARBE," "NARBE Foundation," "Benny’s Accessibility Hub," or "SwitchedGames" (also presented as "Switched Games" and "SwitchedGames.org"), and any related branding, logos, or marks, does not grant trademark rights. Derivative works must not imply endorsement or official affiliation without written permission.

For partnership or branding inquiries, please visit:
https://narbehouse.com

*/
/**
 * iOS/Mobile Audio Autoplay Unlocker
 * Safely wakes up WebAudio and SpeechSynthesis on the first touch interaction.
 */
(function() {
    'use strict';

    if (window.NarbeAudioFixLoaded) return;
    window.NarbeAudioFixLoaded = true;

    const audioContexts = [];
    let isUnlocked = false;

    // 1. Monkey-patch the AudioContext constructor to capture contexts
    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    if (OriginalAudioContext) {
        const AudioContextProxy = function(options) {
            const ctx = new OriginalAudioContext(options);
            audioContexts.push(ctx);
            // If already unlocked, resume immediately
            if (isUnlocked && ctx.state === 'suspended') {
                ctx.resume().catch(e => {});
            }
            return ctx;
        };
        AudioContextProxy.prototype = OriginalAudioContext.prototype;
        Object.assign(AudioContextProxy, OriginalAudioContext);
        
        window.AudioContext = AudioContextProxy;
        window.webkitAudioContext = AudioContextProxy;
    }

    // Shared context for file-based playback
    let sharedCtx = null;
    const bufferCache = new Map();

    async function loadBuffer(url, ctx) {
        if (bufferCache.has(url)) return bufferCache.get(url);
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            bufferCache.set(url, audioBuffer);
            return audioBuffer;
        } catch (e) {
            console.error('Failed to load audio:', url, e);
            return null;
        }
    }

    // Export a helper for playing sounds via WebAudio (bypassing <audio> tag restrictions)
    window.NarbeAudioHelper = {
        play: function(url, volume = 1.0) {
            if (!sharedCtx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) sharedCtx = new AC();
            }
            if (!sharedCtx) return;

            // Ensure context is running
            if (sharedCtx.state === 'suspended' && isUnlocked) {
                sharedCtx.resume().catch(e => {});
            }

            var controller = {
                source: null,
                stop: function() {
                    try { if (this.source) this.source.stop(); } catch(e){}
                    this.source = null;
                    this.stopped = true;
                },
                stopped: false
            };

            loadBuffer(url, sharedCtx).then(buffer => {
                if (!buffer || controller.stopped) return;
                const source = sharedCtx.createBufferSource();
                source.buffer = buffer;
                const gain = sharedCtx.createGain();
                gain.gain.value = volume;
                source.connect(gain);
                gain.connect(sharedCtx.destination);
                source.onended = function() { controller.source = null; };
                source.start(0);
                controller.source = source;
            });
            return controller;
        },
        resumeAll: function() {
            unlockAudio();
        }
    };

    // 2. The Unlock Routine
    function unlockAudio() {
        isUnlocked = true;

        // A. Wake up sound effects
        audioContexts.forEach(ctx => {
            if (ctx.state === 'suspended') ctx.resume().catch(e=>{});
        });
        if (sharedCtx && sharedCtx.state === 'suspended') {
            sharedCtx.resume().catch(e=>{});
        }

        // B. Wake up Voices (Silent Speak)
        if (window.speechSynthesis && !window.speechSynthesis.speaking) {
            const silent = new SpeechSynthesisUtterance('');
            silent.volume = 0; 
            silent.rate = 10;
            window.speechSynthesis.speak(silent);
        }

        // C. Clean up
        ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'].forEach(evt => 
            document.removeEventListener(evt, unlockAudio, true)
        );
    }

    // 3. Listen for first interaction
    ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'].forEach(evt => 
        document.addEventListener(evt, unlockAudio, { capture: true, passive: true })
    );

})();
