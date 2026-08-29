package com.ayush.doctorapp.fragments

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.ayush.doctorapp.activities.PatientDetailActivity
import com.ayush.doctorapp.adapters.PatientAdapter
import com.ayush.doctorapp.databinding.FragmentPatientListBinding
import com.ayush.doctorapp.models.Patient
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.TokenManager
import com.ayush.doctorapp.viewmodels.PatientViewModel

class PatientListFragment : Fragment() {

    private var _binding: FragmentPatientListBinding? = null
    private val binding get() = _binding!!
    private lateinit var patientAdapter: PatientAdapter
    private lateinit var patientViewModel: PatientViewModel
    private val tokenManager by lazy { TokenManager(requireContext()) }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPatientListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        patientViewModel = ViewModelProvider(this).get(PatientViewModel::class.java)

        setupRecyclerView()
        setupObservers()
        refreshData()

        binding.swipeRefresh.setOnRefreshListener {
            refreshData()
        }
    }

    private fun setupRecyclerView() {
        patientAdapter = PatientAdapter { patient ->
            navigateToPatientDetail(patient)
        }
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = patientAdapter
        }
    }

    private fun setupObservers() {
        patientViewModel.patients.observe(viewLifecycleOwner) { result ->
            binding.swipeRefresh.isRefreshing = false
            when (result) {
                is ApiResult.Success -> {
                    result.data?.let { patients ->
                        patientAdapter.submitList(patients)
                        binding.tvEmpty.visibility = if (patients.isEmpty()) View.VISIBLE else View.GONE
                    }
                    binding.progressBar.visibility = View.GONE
                }
                is ApiResult.Error -> {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(requireContext(), result.message, Toast.LENGTH_LONG).show()
                }
                is ApiResult.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                }
            }
        }
    }

    fun refreshData() {
        val token = tokenManager.getToken()
        if (token != null) {
            patientViewModel.getPatients(token)
        }
    }

    private fun navigateToPatientDetail(patient: Patient) {
        val intent = Intent(requireContext(), PatientDetailActivity::class.java)
        intent.putExtra("abhaId", patient.abhaId)
        intent.putExtra("patientName", patient.name)
        startActivity(intent)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}