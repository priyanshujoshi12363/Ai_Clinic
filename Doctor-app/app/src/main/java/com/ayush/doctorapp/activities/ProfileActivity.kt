package com.ayush.doctorapp.activities

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.ayush.doctorapp.databinding.ActivityProfileBinding
import com.ayush.doctorapp.utils.TokenManager

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private val tokenManager = TokenManager(this)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        loadDoctorData()
        setupListeners()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Profile"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun loadDoctorData() {
        val doctor = tokenManager.getDoctor()
        if (doctor != null) {
            binding.tvDoctorName.text = "${doctor.name.firstName} ${doctor.name.lastName}"
            binding.tvSpecialization.text = doctor.specialization
            binding.tvEmail.text = doctor.contact.email
            binding.tvMobile.text = doctor.contact.mobile
            binding.tvHospital.text = "Hospital: ${doctor.hospital.hospitalName}"
            binding.tvDepartment.text = "Department: ${doctor.hospital.departmentName}"
            binding.tvRegistration.text = "Reg No: ${doctor.registrationNumber}"
        }
    }

    private fun setupListeners() {
        binding.btnLogout.setOnClickListener {
            tokenManager.clearAll()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}