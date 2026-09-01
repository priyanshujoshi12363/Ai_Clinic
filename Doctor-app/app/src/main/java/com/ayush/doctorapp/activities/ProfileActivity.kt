package com.ayush.doctorapp.activities

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.ayush.doctorapp.databinding.ActivityProfileBinding
import com.ayush.doctorapp.utils.Formatting
import com.ayush.doctorapp.utils.TokenManager

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private val tokenManager by lazy { TokenManager(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Profile"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        val doctor = tokenManager.getDoctor()
        val fullName = doctor?.name?.display() ?: "Doctor"

        binding.tvAvatar.text = Formatting.initials(fullName)
        binding.tvName.text = "Dr. " + fullName
        binding.tvSpecialization.text = doctor?.specialization ?: "General Medicine"

        binding.tvHospital.text = listOfNotNull(
            doctor?.hospital?.hospitalName,
            doctor?.hospital?.departmentName
        ).joinToString("\n").ifBlank { "Not recorded" }

        binding.tvContact.text = listOfNotNull(
            doctor?.email
        ).joinToString("\n").ifBlank { "Not recorded" }

        binding.tvAccount.text = listOfNotNull(
            doctor?.username?.let { "Username: " + it },
            doctor?.role?.let { "Role: " + it },
            doctor?.doctorId?.let { "ID: " + it }
        ).joinToString("\n").ifBlank { "Not recorded" }

        binding.btnLogout.setOnClickListener {
            tokenManager.clear()
            startActivity(Intent(this, LoginActivity::class.java))
            finishAffinity()
        }
    }
}
