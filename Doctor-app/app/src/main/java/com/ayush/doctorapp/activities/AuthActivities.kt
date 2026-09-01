package com.ayush.doctorapp.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.ayush.doctorapp.databinding.ActivityLoginBinding
import com.ayush.doctorapp.databinding.ActivityRegisterBinding
import com.ayush.doctorapp.models.AccountRegister
import com.ayush.doctorapp.models.ConsultationInfo
import com.ayush.doctorapp.models.ContactInfo
import com.ayush.doctorapp.models.DoctorName
import com.ayush.doctorapp.models.HospitalInfo
import com.ayush.doctorapp.models.RegisterRequest
import com.ayush.doctorapp.network.ApiClient
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.TokenManager
import com.ayush.doctorapp.viewmodels.AuthViewModel
import com.google.android.material.snackbar.Snackbar

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val authViewModel: AuthViewModel by viewModels()
    private val tokenManager by lazy { TokenManager(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (TokenManager(this).isLoggedIn()) {
            goToDashboard()
            return
        }

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.tvServer.text = "Server: ${ApiClient.BASE_URL}"

        authViewModel.result.observe(this) { result ->
            when (result) {
                is ApiResult.Loading -> setLoading(true)
                is ApiResult.Success -> {
                    setLoading(false)
                    goToDashboard()
                }
                is ApiResult.Error -> {
                    setLoading(false)
                    Snackbar.make(binding.root, result.message, Snackbar.LENGTH_LONG).show()
                }
            }
        }

        binding.btnLogin.setOnClickListener {
            val username = binding.etUsername.text?.toString()?.trim().orEmpty()
            val password = binding.etPassword.text?.toString()?.trim().orEmpty()

            if (username.isEmpty()) {
                binding.etUsername.error = "Username required"
                return@setOnClickListener
            }
            if (password.isEmpty()) {
                binding.etPassword.error = "Password required"
                return@setOnClickListener
            }

            authViewModel.login(username, password)
        }

        binding.tvRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnLogin.isEnabled = !loading
    }

    private fun goToDashboard() {
        startActivity(Intent(this, DashboardActivity::class.java))
        finish()
    }
}

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Register"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        authViewModel.result.observe(this) { result ->
            when (result) {
                is ApiResult.Loading -> setLoading(true)
                is ApiResult.Success -> {
                    setLoading(false)
                    startActivity(Intent(this, DashboardActivity::class.java))
                    finishAffinity()
                }
                is ApiResult.Error -> {
                    setLoading(false)
                    Snackbar.make(binding.root, result.message, Snackbar.LENGTH_LONG).show()
                }
            }
        }

        binding.btnRegister.setOnClickListener { submit() }
        binding.tvLogin.setOnClickListener { finish() }
    }

    private fun field(text: CharSequence?): String = text?.toString()?.trim().orEmpty()

    private fun submit() {
        val firstName = field(binding.etFirstName.text)
        val lastName = field(binding.etLastName.text)
        val regNumber = field(binding.etRegNumber.text)
        val specialization = field(binding.etSpecialization.text)
        val hospital = field(binding.etHospital.text)
        val department = field(binding.etDepartment.text)
        val mobile = field(binding.etMobile.text)
        val email = field(binding.etEmail.text)
        val username = field(binding.etUsername.text)
        val password = field(binding.etPassword.text)

        val required = listOf(
            firstName to binding.etFirstName,
            lastName to binding.etLastName,
            regNumber to binding.etRegNumber,
            specialization to binding.etSpecialization,
            hospital to binding.etHospital,
            department to binding.etDepartment,
            mobile to binding.etMobile,
            email to binding.etEmail,
            username to binding.etUsername,
            password to binding.etPassword
        )

        val missing = required.firstOrNull { it.first.isEmpty() }
        if (missing != null) {
            missing.second.error = "Required"
            missing.second.requestFocus()
            return
        }

        val slug = hospital.filter { it.isLetterOrDigit() }.take(6).uppercase()

        authViewModel.register(
            RegisterRequest(
                doctorId = "DR-${System.currentTimeMillis().toString().takeLast(6)}",
                name = DoctorName(firstName, null, lastName),
                registrationNumber = regNumber,
                specialization = specialization,
                hospital = HospitalInfo(
                    hospitalId = "HOSP_$slug",
                    hospitalName = hospital,
                    departmentId = "DEPT_${department.filter { it.isLetterOrDigit() }.take(6).uppercase()}",
                    departmentName = department
                ),
                contact = ContactInfo(mobile, email),
                consultation = ConsultationInfo(listOf("GENERAL_OPD", "AYUSH")),
                account = AccountRegister(username, password)
            )
        )
    }

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnRegister.isEnabled = !loading
    }
}
