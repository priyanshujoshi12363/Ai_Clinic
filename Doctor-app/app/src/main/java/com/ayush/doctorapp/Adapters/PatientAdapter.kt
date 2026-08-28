package com.ayush.doctorapp.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.ayush.doctorapp.databinding.ItemPatientBinding
import com.ayush.doctorapp.models.Patient

class PatientAdapter(
    private val onItemClick: (Patient) -> Unit
) : ListAdapter<Patient, PatientAdapter.PatientViewHolder>(PatientDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PatientViewHolder {
        val binding = ItemPatientBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return PatientViewHolder(binding, onItemClick)
    }

    override fun onBindViewHolder(holder: PatientViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class PatientViewHolder(
        private val binding: ItemPatientBinding,
        private val onItemClick: (Patient) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(patient: Patient) {
            binding.tvPatientName.text = patient.name
            binding.tvAbhaId.text = "ABHA: ${patient.abhaId}"
            
            val age = calculateAge(patient.dateOfBirth)
            binding.tvGenderAge.text = "${patient.gender}, $age years"

            binding.root.setOnClickListener {
                onItemClick(patient)
            }
        }

        private fun calculateAge(dateOfBirth: String): Int {
            return try {
                val parts = dateOfBirth.split("-")
                val birthYear = parts[0].toInt()
                val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
                currentYear - birthYear
            } catch (e: Exception) {
                0
            }
        }
    }

    class PatientDiffCallback : DiffUtil.ItemCallback<Patient>() {
        override fun areItemsTheSame(oldItem: Patient, newItem: Patient): Boolean {
            return oldItem.abhaId == newItem.abhaId
        }

        override fun areContentsTheSame(oldItem: Patient, newItem: Patient): Boolean {
            return oldItem == newItem
        }
    }
}