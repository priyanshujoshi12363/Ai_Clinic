package com.ayush.doctorapp.utils

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

object Formatting {

    fun ageFrom(dateOfBirth: String?): Int? {
        if (dateOfBirth.isNullOrBlank()) return null
        val year = dateOfBirth.take(4).toIntOrNull() ?: return null
        val now = Calendar.getInstance().get(Calendar.YEAR)
        val age = now - year
        return if (age in 0..130) age else null
    }

    fun personLine(name: String?, gender: String?, dateOfBirth: String?): String {
        val age = ageFrom(dateOfBirth)
        val bits = listOfNotNull(
            age?.let { "$it yrs" },
            gender?.takeIf { it.isNotBlank() }
        )
        return if (bits.isEmpty()) name.orEmpty() else bits.joinToString(" · ")
    }

    fun relativeTime(isoDate: String?): String {
        if (isoDate.isNullOrBlank()) return ""
        val parsed = runCatching {
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.parse(isoDate.take(19))
        }.getOrNull() ?: return ""

        val minutes = ((System.currentTimeMillis() - parsed.time) / 60000L).toInt()
        return when {
            minutes < 1 -> "just now"
            minutes < 60 -> "$minutes min ago"
            minutes < 1440 -> "${minutes / 60} hr ago"
            else -> "${minutes / 1440} d ago"
        }
    }

    fun initials(name: String?): String {
        val clean = name?.trim().orEmpty()
        if (clean.isEmpty()) return "?"
        val parts = clean.split(" ").filter { it.isNotBlank() }
        return when {
            parts.size >= 2 -> "${parts[0].first()}${parts[1].first()}".uppercase()
            else -> parts[0].take(2).uppercase()
        }
    }
}
