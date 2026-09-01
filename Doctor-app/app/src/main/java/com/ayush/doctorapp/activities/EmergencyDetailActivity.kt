package com.ayush.doctorapp.activities

import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.ayush.doctorapp.R
import com.ayush.doctorapp.adapters.TriageStyle
import com.ayush.doctorapp.databinding.ActivityEmergencyDetailBinding
import com.ayush.doctorapp.models.EmergencyCase
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.BriefingPlayer
import com.ayush.doctorapp.utils.Constants
import com.ayush.doctorapp.utils.TokenManager
import com.ayush.doctorapp.viewmodels.EmergencyViewModel
import com.google.android.material.snackbar.Snackbar

class EmergencyDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityEmergencyDetailBinding
    private val viewModel: EmergencyViewModel by viewModels()
    private val player = BriefingPlayer()
    private val tokenManager by lazy { TokenManager(this) }
    private var emergencyToken: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEmergencyDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        emergencyToken = intent.getStringExtra(Constants.EXTRA_EMERGENCY_TOKEN).orEmpty()

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Emergency case"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        observe()

        if (emergencyToken.isBlank()) {
            Snackbar.make(binding.root, "No emergency token provided", Snackbar.LENGTH_LONG).show()
        } else {
            viewModel.loadCase(emergencyToken)
        }

        binding.btnListen.setOnClickListener {
            if (player.isPlaying()) {
                player.stop()
                binding.btnListen.text = getString(R.string.listen_summary)
            } else {
                binding.btnListen.isEnabled = false
                viewModel.loadBriefing(emergencyToken)
            }
        }

        binding.btnAccept.setOnClickListener { updateStatus("IN_PROGRESS") }
        binding.btnComplete.setOnClickListener { updateStatus("COMPLETED") }
    }

    private fun updateStatus(status: String) {
        val doctorName = tokenManager.getDoctor()?.name?.display()
        viewModel.updateStatus(emergencyToken, status, doctorName)
    }

    private fun observe() {
        viewModel.detail.observe(this) { result ->
            when (result) {
                is ApiResult.Loading -> binding.progressBar.visibility = View.VISIBLE
                is ApiResult.Success -> {
                    binding.progressBar.visibility = View.GONE
                    render(result.data)
                }
                is ApiResult.Error -> {
                    binding.progressBar.visibility = View.GONE
                    Snackbar.make(binding.root, result.message, Snackbar.LENGTH_LONG).show()
                }
            }
        }

        viewModel.briefing.observe(this) { result ->
            when (result) {
                is ApiResult.Loading -> Unit
                is ApiResult.Success -> {
                    binding.btnListen.isEnabled = true
                    val chunks = result.data.audios.orEmpty()
                    if (chunks.isEmpty()) {
                        Snackbar.make(binding.root, "No audio returned", Snackbar.LENGTH_SHORT).show()
                    } else {
                        binding.btnListen.text = getString(R.string.stop_audio)
                        player.play(cacheDir, chunks, result.data.format) {
                            runOnUiThread { binding.btnListen.text = getString(R.string.listen_summary) }
                        }
                    }
                }
                is ApiResult.Error -> {
                    binding.btnListen.isEnabled = true
                    Snackbar.make(binding.root, result.message, Snackbar.LENGTH_LONG).show()
                }
            }
        }

        viewModel.statusUpdated.observe(this) { result ->
            when (result) {
                is ApiResult.Loading -> Unit
                is ApiResult.Success -> {
                    Snackbar.make(binding.root, "Status updated", Snackbar.LENGTH_SHORT).show()
                    finish()
                }
                is ApiResult.Error ->
                    Snackbar.make(binding.root, result.message, Snackbar.LENGTH_LONG).show()
            }
        }
    }

    private fun setSection(label: View, body: TextView, value: String?) {
        val text = value?.trim().orEmpty()
        if (text.isEmpty()) {
            label.visibility = View.GONE
            body.visibility = View.GONE
        } else {
            label.visibility = View.VISIBLE
            body.visibility = View.VISIBLE
            body.text = text
        }
    }

    private fun render(case: EmergencyCase) {
        val triageColor = ContextCompat.getColor(this, TriageStyle.barColor(case.triageLevel))

        binding.toolbar.setBackgroundColor(triageColor)
        window.statusBarColor = triageColor

        binding.tvTriage.text = listOfNotNull(
            case.triageLevel,
            case.triageLabel,
            case.targetMinutes?.let { "see within ${it} min" }
        ).joinToString(" · ")
        binding.tvTriage.setBackgroundResource(TriageStyle.chipBackground(case.triageLevel))
        binding.tvTriage.setTextColor(triageColor)

        binding.tvToken.text = case.tokenNumber.orEmpty()
        binding.tvComplaint.text = case.chiefComplaint?.takeIf { it.isNotBlank() }
            ?: case.symptoms.orEmpty()

        val identified = case.identificationStatus == "IDENTIFIED"
        binding.tvPatient.text = listOfNotNull(
            if (identified) case.patientName else "Not yet identified",
            case.abhaId,
            case.suspectedCategory,
            case.waitingMinutes?.let { "waiting ${it} min" },
            case.status
        ).joinToString(" · ")

        val flags = case.redFlags.orEmpty()
        if (flags.isEmpty()) {
            binding.tvRedFlags.visibility = View.GONE
        } else {
            binding.tvRedFlags.visibility = View.VISIBLE
            binding.tvRedFlags.text = "RED FLAGS\n" + flags.joinToString("\n") { "• $it" }
        }

        setSection(binding.lblSummary, binding.tvSummary, case.aiSummary)
        setSection(binding.lblKeyPoints, binding.tvKeyPoints,
            case.keyPoints?.joinToString("\n") { "• $it" })

        setSection(binding.lblAnswers, binding.tvAnswers,
            case.answers?.takeIf { it.isNotEmpty() }?.joinToString("\n\n") { answer ->
                "${answer.question.orEmpty()}\n→ ${answer.answer.orEmpty()}"
            })

        val history = case.knownHistory
        setSection(binding.lblHistory, binding.tvHistory,
            if (!identified || history == null) {
                null
            } else {
                listOfNotNull(
                    history.conditions?.takeIf { it.isNotEmpty() }?.let { "Conditions: ${it.joinToString(", ")}" },
                    history.allergies?.takeIf { it.isNotEmpty() }?.let { "Allergies: ${it.joinToString(", ")}" },
                    history.medicines?.takeIf { it.isNotEmpty() }?.let { "Medicines: ${it.joinToString(", ")}" }
                ).joinToString("\n").takeIf { it.isNotBlank() }
            })

        binding.btnAccept.isEnabled = case.status != "COMPLETED"
        binding.btnComplete.isEnabled = case.status != "COMPLETED"
    }

    override fun onStop() {
        super.onStop()
        player.stop()
    }
}
