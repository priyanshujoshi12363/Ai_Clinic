package com.ayush.doctorapp.activities

import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.ayush.doctorapp.databinding.ActivityRegisterBinding
import com.ayush.doctorapp.models.AccountRegister
import com.ayush.doctorapp.models.ConsultationInfo
import com.ayush.doctorapp.models.ContactInfo
import com.ayush.doctorapp.models.DoctorName
import com.ayush.doctorapp.models.HospitalInfo
import com.ayush.doctorapp.models.RegisterRequest
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.viewmodels.AuthViewModel

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupObservers()
        setupListeners()
    }

    private fun setupObservers() {
        authViewModel.registerResult.observe(this) { result ->
            when (result) {
                is ApiResult.Success -> {
                    hideLoading()
                    Toast.makeText(this, "Registration successful!", Toast.LENGTH_SHORT).show()
                    finish()
                }
                is ApiResult.Error -> {
                    hideLoading()
                    Toast.makeText(this, result.message, Toast.LENGTH_LONG).show()
                }
                is ApiResult.Loading -> {
                    showLoading()
                }
            }
        }
    }

    private fun setupListeners() {
        binding.btnRegister.setOnClickListener {
            val firstName = binding.etFirstName.text.toString().trim()
            val lastName = binding.etLastName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val mobile = binding.etMobile.text.toString().trim()
            val username = binding.etUsername.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()
            val registrationNumber = "REG${System.currentTimeMillis()}"
            val doctorId = "DOC${System.currentTimeMillis()}"

            if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty() || mobile.isEmpty() || username.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "All fields are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = RegisterRequest(
                doctorId = doctorId,
                name = DoctorName(firstName, null, lastName),
                registrationNumber = registrationNumber,
                specialization = "General Medicine",
                hospital = HospitalInfo(
                    hospitalId = "HOSP_001",
                    hospitalName = "Demo Hospital",
                    departmentId = "DEPT_001",
                    departmentName = "General Medicine"
                ),
                contact = ContactInfo(mobile, email),
                consultation = ConsultationInfo(listOf("GENERAL_OPD")),
                account = AccountRegister(username, password)
            )

            authViewModel.register(request)
        }
    }

    private fun showLoading() {
        binding.btnRegister.isEnabled = false
        binding.progressBar.visibility = android.view.View.VISIBLE
    }

    private fun hideLoading() {
        binding.btnRegister.isEnabled = true
        binding.progressBar.visibility = android.view.View.GONE
    }
}