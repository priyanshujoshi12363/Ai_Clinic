package com.ayush.doctorapp.activities

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.ayush.doctorapp.R
import com.ayush.doctorapp.adapters.PatientAdapter
import com.ayush.doctorapp.databinding.ActivityDashboardBinding
import com.ayush.doctorapp.models.Patient
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.TokenManager
import com.ayush.doctorapp.viewmodels.PatientViewModel

class DashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDashboardBinding
    private lateinit var patientAdapter: PatientAdapter
    private val patientViewModel: PatientViewModel by viewModels()
    private val tokenManager = TokenManager(this)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupRecyclerView()
        setupObservers()
        loadPatients()

        binding.swipeRefresh.setOnRefreshListener {
            loadPatients()
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Dashboard"
    }

    private fun setupRecyclerView() {
        patientAdapter = PatientAdapter { patient ->
            navigateToPatientDetail(patient)
        }
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(this@DashboardActivity)
            adapter = patientAdapter
        }
    }

    private fun setupObservers() {
        patientViewModel.patients.observe(this) { result ->
            binding.swipeRefresh.isRefreshing = false
            when (result) {
                is ApiResult.Success -> {
                    result.data?.let { patients ->
                        patientAdapter.submitList(patients)
                    }
                    binding.progressBar.visibility = android.view.View.GONE
                }
                is ApiResult.Error -> {
                    binding.progressBar.visibility = android.view.View.GONE
                }
                is ApiResult.Loading -> {
                    binding.progressBar.visibility = android.view.View.VISIBLE
                }
            }
        }
    }

    private fun loadPatients() {
        val token = tokenManager.getToken()
        if (token != null) {
            patientViewModel.getPatients(token)
        }
    }

    private fun navigateToPatientDetail(patient: Patient) {
        val intent = Intent(this, PatientDetailActivity::class.java)
        intent.putExtra("abhaId", patient.abhaId)
        intent.putExtra("patientName", patient.name)
        startActivity(intent)
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.dashboard_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_profile -> {
                startActivity(Intent(this, ProfileActivity::class.java))
                true
            }
            R.id.action_logout -> {
                tokenManager.clearAll()
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}