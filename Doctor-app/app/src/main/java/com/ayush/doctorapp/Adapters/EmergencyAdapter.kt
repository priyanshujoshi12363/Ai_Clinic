package com.ayush.doctorapp.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.ayush.doctorapp.databinding.ItemEmergencyBinding
import com.ayush.doctorapp.models.EmergencyItem

class EmergencyAdapter(
    private val onItemClick: (EmergencyItem) -> Unit
) : ListAdapter<EmergencyItem, EmergencyAdapter.EmergencyViewHolder>(EmergencyDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): EmergencyViewHolder {
        val binding = ItemEmergencyBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return EmergencyViewHolder(binding, onItemClick)
    }

    override fun onBindViewHolder(holder: EmergencyViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class EmergencyViewHolder(
        private val binding: ItemEmergencyBinding,
        private val onItemClick: (EmergencyItem) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(emergency: EmergencyItem) {
            binding.tvPatientName.text = emergency.patientName
            binding.tvAbhaId.text = "ABHA: ${emergency.abhaId}"
            binding.tvSymptoms.text = emergency.symptoms.joinToString(", ")
            binding.tvTime.text = "🕐 ${emergency.timestamp}"
            
            when (emergency.urgency) {
                "EMERGENCY" -> {
                    binding.ivPriority.setColorFilter(android.graphics.Color.RED)
                    binding.cardEmergency.setCardBackgroundColor(android.graphics.Color.parseColor("#FFF5F5"))
                }
                "URGENT" -> {
                    binding.ivPriority.setColorFilter(android.graphics.Color.YELLOW)
                    binding.cardEmergency.setCardBackgroundColor(android.graphics.Color.parseColor("#FFFFF5"))
                }
                else -> {
                    binding.ivPriority.setColorFilter(android.graphics.Color.GRAY)
                    binding.cardEmergency.setCardBackgroundColor(android.graphics.Color.WHITE)
                }
            }

            binding.root.setOnClickListener {
                onItemClick(emergency)
            }
        }
    }

    class EmergencyDiffCallback : DiffUtil.ItemCallback<EmergencyItem>() {
        override fun areItemsTheSame(oldItem: EmergencyItem, newItem: EmergencyItem): Boolean {
            return oldItem.emergencyId == newItem.emergencyId
        }

        override fun areContentsTheSame(oldItem: EmergencyItem, newItem: EmergencyItem): Boolean {
            return oldItem == newItem
        }
    }
}