package com.ayush.doctorapp.activities

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Filter
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.ayush.doctorapp.adapters.MedRow
import com.ayush.doctorapp.adapters.PrescribeMedicineAdapter
import com.ayush.doctorapp.databinding.ActivityPrescribeBinding
import com.ayush.doctorapp.models.CreatePrescriptionRequest
import com.ayush.doctorapp.models.Medicine
import com.ayush.doctorapp.models.PrescriptionMedicineInput
import com.ayush.doctorapp.network.ApiClient
import com.ayush.doctorapp.utils.Constants
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch

class PrescribeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPrescribeBinding
    private lateinit var adapter: PrescribeMedicineAdapter

    private var abhaId = ""
    private var lastResults: List<Medicine> = emptyList()
    private val handler = Handler(Looper.getMainLooper())
    private var searchJob: Runnable? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPrescribeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        abhaId = intent.getStringExtra(Constants.EXTRA_ABHA_ID).orEmpty()
        val patientName = intent.getStringExtra(Constants.EXTRA_PATIENT_NAME).orEmpty()

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        binding.tvPatient.text = patientName.ifBlank { "Patient" }
        binding.tvAbha.text = abhaId

        adapter = PrescribeMedicineAdapter { refreshEmpty() }
        binding.rvMedicines.layoutManager = LinearLayoutManager(this)
        binding.rvMedicines.adapter = adapter
        refreshEmpty()

        setupSearch()

        binding.btnSave.setOnClickListener { save() }
    }

    private fun refreshEmpty() {
        binding.tvEmpty.visibility = if (adapter.rows.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun setupSearch() {
        // A server-driven suggestion list — the built-in filter is disabled so our
        // Mongo search results are shown as-is.
        val names = ArrayList<String>()
        val suggestAdapter = object : ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, names) {
            override fun getFilter(): Filter = object : Filter() {
                override fun performFiltering(c: CharSequence?) = FilterResults()
                override fun publishResults(c: CharSequence?, r: FilterResults?) { /* keep server results */ }
            }
        }
        binding.etSearch.setAdapter(suggestAdapter)

        binding.etSearch.setOnItemClickListener { _, _, position, _ ->
            lastResults.getOrNull(position)?.let { add(it) }
            binding.etSearch.setText("")
        }

        binding.etSearch.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: android.text.Editable?) {
                val q = s?.toString().orEmpty()
                searchJob?.let { handler.removeCallbacks(it) }
                searchJob = Runnable { search(q, suggestAdapter, names) }
                handler.postDelayed(searchJob!!, 180)
            }
        })
    }

    private fun search(q: String, suggestAdapter: ArrayAdapter<String>, names: ArrayList<String>) {
        lifecycleScope.launch {
            try {
                val res = ApiClient.apiService.searchMedicines(q)
                val list = res.body()?.data.orEmpty()
                lastResults = list
                names.clear()
                names.addAll(list.map { "${it.name}  ${it.strength ?: ""}".trim() })
                suggestAdapter.notifyDataSetChanged()
                if (names.isNotEmpty() && binding.etSearch.hasFocus()) binding.etSearch.showDropDown()
            } catch (_: Exception) { /* offline / ignore */ }
        }
    }

    private fun add(m: Medicine) {
        adapter.add(MedRow(
            display = "${m.name}  ${m.strength ?: ""}".trim(),
            name = m.name,
            dosage = m.strength ?: "",
            frequency = m.defaultFrequency ?: "1-0-1",
            timing = m.defaultTiming ?: "After food",
            duration = m.defaultDuration ?: "5 days"
        ))
    }

    private fun save() {
        if (abhaId.isBlank()) {
            Snackbar.make(binding.root, "This patient has no ABHA ID to save against.", Snackbar.LENGTH_LONG).show(); return
        }
        if (adapter.rows.isEmpty()) {
            Snackbar.make(binding.root, "Add at least one medicine.", Snackbar.LENGTH_SHORT).show(); return
        }
        val request = CreatePrescriptionRequest(
            doctorName = "Dr. A. Verma",
            specialty = "General Medicine",
            diagnosis = binding.etDiagnosis.text?.toString()?.trim().orEmpty(),
            instructions = binding.etAdvice.text?.toString()?.trim().orEmpty(),
            medicines = adapter.rows.map {
                PrescriptionMedicineInput(
                    name = it.name, dosage = it.dosage, frequency = it.frequency,
                    timing = it.timing, duration = it.duration
                )
            }
        )
        binding.progressBar.visibility = View.VISIBLE
        binding.btnSave.isEnabled = false
        lifecycleScope.launch {
            try {
                val res = ApiClient.apiService.createPrescription(abhaId, request)
                binding.progressBar.visibility = View.GONE
                binding.btnSave.isEnabled = true
                if (res.isSuccessful && res.body()?.success == true) {
                    Snackbar.make(binding.root, "✓ Prescription saved to the patient's record", Snackbar.LENGTH_LONG).show()
                    binding.root.postDelayed({ finish() }, 900)
                } else {
                    Snackbar.make(binding.root, res.body()?.message ?: "Could not save prescription", Snackbar.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                binding.progressBar.visibility = View.GONE
                binding.btnSave.isEnabled = true
                Snackbar.make(binding.root, "Network error: ${e.message}", Snackbar.LENGTH_LONG).show()
            }
        }
    }
}
