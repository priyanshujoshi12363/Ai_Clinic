package com.ayush.doctorapp.utils

import android.media.MediaPlayer
import android.util.Base64
import android.util.Log
import java.io.File

class BriefingPlayer {

    private var player: MediaPlayer? = null
    private var queue: List<File> = emptyList()
    private var index = 0
    private var onFinished: (() -> Unit)? = null

    fun play(cacheDir: File, base64Chunks: List<String>, format: String?, onDone: () -> Unit) {
        stop()
        onFinished = onDone

        queue = base64Chunks.mapIndexedNotNull { i, chunk ->
            runCatching {
                val bytes = Base64.decode(chunk, Base64.DEFAULT)
                File(cacheDir, "briefing_$i.${format ?: "wav"}").apply { writeBytes(bytes) }
            }.getOrNull()
        }

        if (queue.isEmpty()) {
            onDone()
            return
        }

        index = 0
        playCurrent()
    }

    private fun playCurrent() {
        if (index >= queue.size) {
            stop()
            onFinished?.invoke()
            return
        }

        runCatching {
            player = MediaPlayer().apply {
                setDataSource(queue[index].absolutePath)
                setOnCompletionListener {
                    index++
                    playCurrent()
                }
                setOnErrorListener { _, _, _ ->
                    index++
                    playCurrent()
                    true
                }
                prepare()
                start()
            }
        }.onFailure {
            Log.w("BriefingPlayer", "playback failed: ${it.message}")
            index++
            playCurrent()
        }
    }

    fun isPlaying(): Boolean = runCatching { player?.isPlaying == true }.getOrDefault(false)

    fun stop() {
        runCatching {
            player?.let {
                if (it.isPlaying) it.stop()
                it.release()
            }
        }
        player = null
    }
}
