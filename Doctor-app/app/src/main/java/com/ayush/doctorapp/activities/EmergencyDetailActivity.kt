package com.ayush.doctorapp.activities

import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.ayush.doctorapp.databinding.ActivityEmergencyDetailBinding
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.TokenManager
import com.ayush.doctorapp.viewmodels.EmergencyViewModel

class EmergencyDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityEmergencyDetailBinding
    private val emergencyViewModel: EmergencyViewModel by viewModels()
    private val tokenManager = TokenManager(this)
    private var emergencyId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEmergencyDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        emergencyId = intent.getStringExtra("emergencyId") ?: ""

        setupToolbar()
        setupObservers()
        loadEmergencyDetail()

        binding.btnAccept.setOnClickListener {
            updateEmergencyStatus("IN_PROGRESS")
        }

        binding.btnComplete.setOnClickListener {
            updateEmergencyStatus("COMPLETED")
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Emergency Case"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupObservers() {
        emergencyViewModel.emergencyDetail.observe(this) { result ->
            when (result) {
                is ApiResult.Success -> {
                    binding.progressBar.visibility = View.GONE
                    result.data?.let { detail ->
                        displayEmergencyDetail(detail)
                    }
                }
                is ApiResult.Error -> {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this, result.message, Toast.LENGTH_LONG).show()
                }
                is ApiResult.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                }
            }
        }
    }

    private fun loadEmergencyDetail() {
        val token = tokenManager.getToken()
        if (token != null && emergencyId.isNotEmpty()) {
            emergencyViewModel.getEmergencyDetail(token, emergencyId)
        }
    }

    private fun displayEmergencyDetail(detail: com.ayush.doctorapp.models.EmergencyDetail) {
        binding.tvPatientName.text = detail.patient.name
        binding.tvAbhaId.text = "ABHA: ${detail.patient.abhaId}"
        binding.tvAge.text = "Age: ${detail.patient.age} years"
        binding.tvGender.text = "Gender: ${detail.patient.gender}"
        binding.tvMobile.text = "Mobile: ${detail.patient.mobile}"

        binding.tvSymptoms.text = detail.symptoms.joinToString(", ")
        binding.tvSummary.text = detail.aiSummary

        detail.medicalHistory?.let { history ->
            binding.tvConditions.text = "Conditions: ${history.conditions?.joinToString(", ") ?: "None"}"
            binding.tvAllergies.text = "Allergies: ${history.allergies?.joinToString(", ") ?: "None"}"
            binding.tvMedications.text = "Medications: ${history.medications?.joinToString(", ") ?: "None"}"
        }

        binding.tvQueuePosition.text = "Queue Position: #${detail.queueStatus.queuePosition}"
        binding.tvUrgency.text = "Urgency: ${detail.queueStatus.urgency}"
        binding.tvStatus.text = "Status: ${detail.queueStatus.status}"

        // Show conversation
        detail.conversation?.let { conv ->
            val conversationText = conv.joinToString("\n") { 
                "Q: ${it.question}\nA: ${it.answer}" 
            }
            binding.tvConversation.text = conversationText
        }
    }

    private fun updateEmergencyStatus(status: String) {
        val token = tokenManager.getToken()
        if (token != null) {
            emergencyViewModel.updateEmergencyStatus(token, emergencyId, status)
            Toast.makeText(this, "Status updated to $status", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}