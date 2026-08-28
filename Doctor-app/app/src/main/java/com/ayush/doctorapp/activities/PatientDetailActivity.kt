package com.ayush.doctorapp.activities

import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.ayush.doctorapp.databinding.ActivityPatientDetailBinding
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.TokenManager
import com.ayush.doctorapp.viewmodels.PatientViewModel

class PatientDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPatientDetailBinding
    private val patientViewModel: PatientViewModel by viewModels()
    private val tokenManager = TokenManager(this)
    private var abhaId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPatientDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        abhaId = intent.getStringExtra("abhaId") ?: ""

        setupToolbar()
        setupObservers()
        loadPatientDetails()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Patient Details"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupObservers() {
        patientViewModel.patientDetail.observe(this) { result ->
            when (result) {
                is ApiResult.Success -> {
                    binding.progressBar.visibility = android.view.View.GONE
                    result.data?.let { patient ->
                        displayPatientDetails(patient)
                    }
                }
                is ApiResult.Error -> {
                    binding.progressBar.visibility = android.view.View.GONE
                    Toast.makeText(this, result.message, Toast.LENGTH_LONG).show()
                }
                is ApiResult.Loading -> {
                    binding.progressBar.visibility = android.view.View.VISIBLE
                }
            }
        }
    }

    private fun loadPatientDetails() {
        val token = tokenManager.getToken()
        if (token != null && abhaId.isNotEmpty()) {
            patientViewModel.getPatientById(token, abhaId)
        }
    }

    private fun displayPatientDetails(patient: com.ayush.doctorapp.models.Patient) {
        binding.tvPatientName.text = patient.name
        binding.tvAbhaId.text = "ABHA: ${patient.abhaId}"
        binding.tvGenderAge.text = "${patient.gender}, ${calculateAge(patient.dateOfBirth)} years"
        binding.tvMobile.text = "Mobile: ${patient.mobile}"
        
        val address = patient.address
        if (address != null) {
            val addressString = listOfNotNull(
                address.house,
                address.street,
                address.locality,
                address.district,
                address.state,
                address.pincode
            ).joinToString(", ")
            binding.tvAddress.text = "Address: $addressString"
        } else {
            binding.tvAddress.text = "Address: Not available"
        }

        val medicalHistory = patient.medicalHistory
        if (medicalHistory != null) {
            val conditions = medicalHistory.conditions?.joinToString { it.name } ?: "None"
            val allergies = medicalHistory.allergies?.joinToString { it.allergen } ?: "None"
            val surgeries = medicalHistory.surgeries?.joinToString { it.procedure } ?: "None"
            
            binding.tvConditions.text = "Conditions: $conditions"
            binding.tvAllergies.text = "Allergies: $allergies"
            binding.tvSurgeries.text = "Surgeries: $surgeries"
        }

        val visits = patient.visits
        if (visits != null && visits.isNotEmpty()) {
            val latestVisit = visits.last()
            val aiSummary = latestVisit.aiSummary ?: "No AI summary available"
            binding.tvAISummary.text = "Latest AI Summary: $aiSummary"
        } else {
            binding.tvAISummary.text = "No visits yet"
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

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}