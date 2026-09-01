package com.ayush.doctorapp.fragments

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.ayush.doctorapp.R
import com.ayush.doctorapp.activities.CaseDetailActivity
import com.ayush.doctorapp.activities.EmergencyDetailActivity
import com.ayush.doctorapp.adapters.EmergencyCaseAdapter
import com.ayush.doctorapp.adapters.OpdCaseAdapter
import com.ayush.doctorapp.databinding.FragmentQueueBinding
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.Constants
import com.ayush.doctorapp.viewmodels.EmergencyViewModel
import com.ayush.doctorapp.viewmodels.OpdQueueViewModel
import com.google.android.material.snackbar.Snackbar

class OpdQueueFragment : Fragment() {

    private var _binding: FragmentQueueBinding? = null
    private val binding get() = _binding!!

    private val viewModel: OpdQueueViewModel by viewModels()
    private lateinit var adapter: OpdCaseAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentQueueBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.tvEmpty.text = getString(R.string.empty_opd)

        adapter = OpdCaseAdapter { case ->
            val sessionId = case.sessionId
            if (sessionId.isNullOrBlank()) {
                Snackbar.make(binding.root, "This case has no session record", Snackbar.LENGTH_SHORT).show()
                return@OpdCaseAdapter
            }
            startActivity(
                Intent(requireContext(), CaseDetailActivity::class.java)
                    .putExtra(Constants.EXTRA_SESSION_ID, sessionId)
            )
        }

        binding.recyclerView.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerView.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { viewModel.load() }
        binding.swipeRefresh.setColorSchemeResources(R.color.brand_600)

        viewModel.queue.observe(viewLifecycleOwner) { result ->
            when (result) {
                is ApiResult.Loading -> {
                    if (!binding.swipeRefresh.isRefreshing) binding.progressBar.visibility = View.VISIBLE
                }
                is ApiResult.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(result.data)
                    binding.tvEmpty.visibility = if (result.data.isEmpty()) View.VISIBLE else View.GONE
                }
                is ApiResult.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                    binding.tvEmpty.visibility = if (adapter.itemCount == 0) View.VISIBLE else View.GONE
                    Snackbar.make(binding.root, result.message, Snackbar.LENGTH_LONG).show()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.load()
    }

    fun refresh() = viewModel.load()

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class EmergencyQueueFragment : Fragment() {

    private var _binding: FragmentQueueBinding? = null
    private val binding get() = _binding!!

    private val viewModel: EmergencyViewModel by viewModels()
    private lateinit var adapter: EmergencyCaseAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentQueueBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.tvEmpty.text = getString(R.string.empty_emergency)

        adapter = EmergencyCaseAdapter { case ->
            val token = case.tokenNumber
            if (token.isNullOrBlank()) return@EmergencyCaseAdapter
            startActivity(
                Intent(requireContext(), EmergencyDetailActivity::class.java)
                    .putExtra(Constants.EXTRA_EMERGENCY_TOKEN, token)
            )
        }

        binding.recyclerView.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerView.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { viewModel.load() }
        binding.swipeRefresh.setColorSchemeResources(R.color.triage_red)

        viewModel.queue.observe(viewLifecycleOwner) { result ->
            when (result) {
                is ApiResult.Loading -> {
                    if (!binding.swipeRefresh.isRefreshing) binding.progressBar.visibility = View.VISIBLE
                }
                is ApiResult.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(result.data)
                    binding.tvEmpty.visibility = if (result.data.isEmpty()) View.VISIBLE else View.GONE
                }
                is ApiResult.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                    binding.tvEmpty.visibility = if (adapter.itemCount == 0) View.VISIBLE else View.GONE
                    Snackbar.make(binding.root, result.message, Snackbar.LENGTH_LONG).show()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.load()
    }

    fun refresh() = viewModel.load()

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
