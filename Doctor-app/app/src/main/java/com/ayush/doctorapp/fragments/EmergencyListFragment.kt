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
import com.ayush.doctorapp.activities.EmergencyDetailActivity
import com.ayush.doctorapp.adapters.EmergencyAdapter
import com.ayush.doctorapp.databinding.FragmentEmergencyListBinding
import com.ayush.doctorapp.models.EmergencyItem
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.TokenManager
import com.ayush.doctorapp.viewmodels.EmergencyViewModel

class EmergencyListFragment : Fragment() {

    private var _binding: FragmentEmergencyListBinding? = null
    private val binding get() = _binding!!
    private lateinit var emergencyAdapter: EmergencyAdapter
    private lateinit var emergencyViewModel: EmergencyViewModel
    private val tokenManager by lazy { TokenManager(requireContext()) }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentEmergencyListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        emergencyViewModel = ViewModelProvider(this).get(EmergencyViewModel::class.java)

        setupRecyclerView()
        setupObservers()
        refreshData()

        binding.swipeRefresh.setOnRefreshListener {
            refreshData()
        }
    }

    private fun setupRecyclerView() {
        emergencyAdapter = EmergencyAdapter { emergency ->
            navigateToEmergencyDetail(emergency)
        }
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = emergencyAdapter
        }
    }

    private fun setupObservers() {
        emergencyViewModel.emergencies.observe(viewLifecycleOwner) { result ->
            binding.swipeRefresh.isRefreshing = false
            when (result) {
                is ApiResult.Success -> {
                    result.data?.let { emergencies ->
                        emergencyAdapter.submitList(emergencies)
                        binding.tvEmpty.visibility = if (emergencies.isEmpty()) View.VISIBLE else View.GONE
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
            emergencyViewModel.getEmergencyQueue(token)
        }
    }

    private fun navigateToEmergencyDetail(emergency: EmergencyItem) {
        val intent = Intent(requireContext(), EmergencyDetailActivity::class.java)
        intent.putExtra("emergencyId", emergency.emergencyId)
        intent.putExtra("patientName", emergency.patientName)
        startActivity(intent)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}