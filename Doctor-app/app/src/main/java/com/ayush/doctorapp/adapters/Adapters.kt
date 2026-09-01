package com.ayush.doctorapp.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.Lifecycle
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.ayush.doctorapp.R
import com.ayush.doctorapp.databinding.ItemEmergencyCaseBinding
import com.ayush.doctorapp.databinding.ItemOpdCaseBinding
import com.ayush.doctorapp.fragments.EmergencyQueueFragment
import com.ayush.doctorapp.fragments.OpdQueueFragment
import com.ayush.doctorapp.models.EmergencyCase
import com.ayush.doctorapp.models.OpdCase
import com.ayush.doctorapp.utils.Formatting

object TriageStyle {

    fun barColor(level: String?): Int = when (level) {
        "RED" -> R.color.triage_red
        "ORANGE" -> R.color.triage_orange
        "YELLOW" -> R.color.triage_yellow
        else -> R.color.triage_green
    }

    fun chipBackground(level: String?): Int = when (level) {
        "RED" -> R.drawable.bg_chip_red
        "ORANGE" -> R.drawable.bg_chip_orange
        "YELLOW" -> R.drawable.bg_chip_yellow
        else -> R.drawable.bg_chip_green
    }

    fun urgencyBar(urgency: String?): Int = when (urgency) {
        "EMERGENCY" -> R.color.triage_red
        "URGENT" -> R.color.triage_orange
        else -> R.color.brand_600
    }

    fun urgencyChip(urgency: String?): Int = when (urgency) {
        "EMERGENCY" -> R.drawable.bg_chip_red
        "URGENT" -> R.drawable.bg_chip_orange
        else -> R.drawable.bg_chip_green
    }

    fun urgencyText(urgency: String?): Int = when (urgency) {
        "EMERGENCY" -> R.color.triage_red
        "URGENT" -> R.color.triage_orange
        else -> R.color.triage_green
    }
}

class OpdCaseAdapter(
    private val onClick: (OpdCase) -> Unit
) : ListAdapter<OpdCase, OpdCaseAdapter.Holder>(DIFF) {

    inner class Holder(val binding: ItemOpdCaseBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemOpdCaseBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val item = getItem(position)
        val context = holder.itemView.context

        with(holder.binding) {
            tvAvatar.text = Formatting.initials(item.name)
            tvName.text = item.name ?: "Unidentified patient"
            tvMeta.text = Formatting.personLine(item.name, item.gender, item.dateOfBirth)
                .ifBlank { item.abhaId.orEmpty() }
            tvToken.text = item.tokenNumber ?: "—"
            tvComplaint.text = item.chiefComplaint?.takeIf { it.isNotBlank() }
                ?: item.summary?.take(120)
                ?: "Summary pending"

            tvMode.text = if (item.isAyush) "AYUSH" else "GENERAL OPD"
            tvMode.setBackgroundResource(
                if (item.isAyush) R.drawable.bg_chip_ayush else R.drawable.bg_chip_brand
            )
            tvMode.setTextColor(
                ContextCompat.getColor(
                    context,
                    if (item.isAyush) R.color.ayush_700 else R.color.brand_700
                )
            )

            tvUrgency.text = item.urgency ?: "ROUTINE"
            tvUrgency.setBackgroundResource(TriageStyle.urgencyChip(item.urgency))
            tvUrgency.setTextColor(ContextCompat.getColor(context, TriageStyle.urgencyText(item.urgency)))

            urgencyBar.setBackgroundColor(ContextCompat.getColor(context, TriageStyle.urgencyBar(item.urgency)))
            tvTime.text = Formatting.relativeTime(item.completedAt)

            if (item.hasRedFlags) {
                tvRedFlags.visibility = View.VISIBLE
                tvRedFlags.text = item.redFlags!!.joinToString(" · ")
            } else {
                tvRedFlags.visibility = View.GONE
            }

            root.setOnClickListener { onClick(item) }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<OpdCase>() {
            override fun areItemsTheSame(a: OpdCase, b: OpdCase) = a.sessionId == b.sessionId
            override fun areContentsTheSame(a: OpdCase, b: OpdCase) = a == b
        }
    }
}

class EmergencyCaseAdapter(
    private val onClick: (EmergencyCase) -> Unit
) : ListAdapter<EmergencyCase, EmergencyCaseAdapter.Holder>(DIFF) {

    inner class Holder(val binding: ItemEmergencyCaseBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemEmergencyCaseBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val item = getItem(position)
        val context = holder.itemView.context

        with(holder.binding) {
            tvQueuePos.text = item.queuePosition?.toString() ?: "—"
            tvComplaint.text = item.chiefComplaint?.takeIf { it.isNotBlank() }
                ?: item.symptoms?.take(90)
                ?: "Emergency case"

            val identified = item.identificationStatus == "IDENTIFIED"
            tvPatient.text = if (identified) {
                item.patientName ?: "Identified patient"
            } else {
                "Not yet identified"
            }

            tvToken.text = item.tokenNumber ?: "—"

            tvTriage.text = "${item.triageLevel ?: "?"} · ${item.triageLabel ?: ""}".trim()
            tvTriage.setBackgroundResource(TriageStyle.chipBackground(item.triageLevel))
            tvTriage.setTextColor(ContextCompat.getColor(context, TriageStyle.barColor(item.triageLevel)))
            triageBar.setBackgroundColor(ContextCompat.getColor(context, TriageStyle.barColor(item.triageLevel)))

            tvCategory.text = item.suspectedCategory ?: "OTHER"

            val waited = item.waitingMinutes ?: 0
            tvWaiting.text = if (waited < 60) "${waited}m waiting" else "${waited / 60}h ${waited % 60}m waiting"
            tvWaiting.setTextColor(
                ContextCompat.getColor(
                    context,
                    if (item.breachedTarget == true) R.color.triage_red else R.color.ink_500
                )
            )

            if (!item.redFlags.isNullOrEmpty()) {
                tvRedFlags.visibility = View.VISIBLE
                tvRedFlags.text = item.redFlags.joinToString(" · ")
            } else {
                tvRedFlags.visibility = View.GONE
            }

            root.setOnClickListener { onClick(item) }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<EmergencyCase>() {
            override fun areItemsTheSame(a: EmergencyCase, b: EmergencyCase) = a.tokenNumber == b.tokenNumber
            override fun areContentsTheSame(a: EmergencyCase, b: EmergencyCase) = a == b
        }
    }
}

class DashboardPagerAdapter(
    fragmentManager: FragmentManager,
    lifecycle: Lifecycle
) : FragmentStateAdapter(fragmentManager, lifecycle) {

    override fun getItemCount(): Int = 2

    override fun createFragment(position: Int): Fragment = when (position) {
        1 -> EmergencyQueueFragment()
        else -> OpdQueueFragment()
    }
}
