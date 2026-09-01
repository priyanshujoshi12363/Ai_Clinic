package com.ayush.doctorapp.activities

import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.ayush.doctorapp.R
import com.ayush.doctorapp.adapters.TriageStyle
import com.ayush.doctorapp.databinding.ActivityCaseDetailBinding
import com.ayush.doctorapp.models.AyushHistory
import com.ayush.doctorapp.models.ClinicalHistory
import com.ayush.doctorapp.models.IntakeSession
import com.ayush.doctorapp.models.SessionDocument
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.BriefingPlayer
import com.ayush.doctorapp.utils.Constants
import com.ayush.doctorapp.viewmodels.OpdQueueViewModel
import com.google.android.material.snackbar.Snackbar

class CaseDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCaseDetailBinding
    private val viewModel: OpdQueueViewModel by viewModels()
    private val player = BriefingPlayer()
    private var sessionId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCaseDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionId = intent.getStringExtra(Constants.EXTRA_SESSION_ID).orEmpty()

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Patient case"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        observe()

        if (sessionId.isBlank()) {
            Snackbar.make(binding.root, "No session provided", Snackbar.LENGTH_LONG).show()
        } else {
            viewModel.loadSession(sessionId)
        }

        binding.btnListen.setOnClickListener {
            if (player.isPlaying()) {
                player.stop()
                binding.btnListen.text = getString(R.string.listen_summary)
            } else {
                binding.btnListen.isEnabled = false
                viewModel.loadBriefing(sessionId)
            }
        }
    }

    private fun observe() {
        viewModel.session.observe(this) { result ->
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
    }

    private fun setSection(label: View, body: android.widget.TextView, value: String?) {
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

    private fun render(session: IntakeSession) {
        binding.tvName.text = session.patientName?.takeIf { it.isNotBlank() } ?: "Unidentified patient"
        binding.tvMeta.text = listOfNotNull(
            session.abhaId,
            session.tokenNumber?.let { "Token $it" },
            session.language
        ).joinToString(" · ")

        val isAyush = session.mode == "AYUSH"
        binding.tvMode.text = if (isAyush) "AYUSH" else "GENERAL OPD"
        binding.tvMode.setBackgroundResource(
            if (isAyush) R.drawable.bg_chip_ayush else R.drawable.bg_chip_brand
        )
        binding.tvMode.setTextColor(
            ContextCompat.getColor(this, if (isAyush) R.color.ayush_700 else R.color.brand_700)
        )

        binding.tvUrgency.text = session.urgency ?: "ROUTINE"
        binding.tvUrgency.setBackgroundResource(TriageStyle.urgencyChip(session.urgency))
        binding.tvUrgency.setTextColor(ContextCompat.getColor(this, TriageStyle.urgencyText(session.urgency)))

        val flags = session.redFlags.orEmpty()
        if (flags.isEmpty()) {
            binding.tvRedFlags.visibility = View.GONE
        } else {
            binding.tvRedFlags.visibility = View.VISIBLE
            binding.tvRedFlags.text = "RED FLAGS\n" + flags.joinToString("\n") { "• $it" }
        }

        setSection(binding.lblKeyPoints, binding.tvKeyPoints,
            session.keyPoints?.joinToString("\n") { "• $it" })
        setSection(binding.lblComplaint, binding.tvComplaint, session.chiefComplaint)
        setSection(binding.lblSummary, binding.tvSummary, session.summary)
        setSection(binding.lblHistory, binding.tvHistory, formatHistory(session.clinicalHistory))
        setSection(binding.lblAyush, binding.tvAyush,
            if (isAyush) formatAyush(session.ayushHistory) else null)
        setSection(binding.lblDocuments, binding.tvDocuments, formatDocuments(session.documents))
        setSection(binding.lblTranscript, binding.tvTranscript, formatTranscript(session))
    }

    private fun line(label: String, value: String?): String? =
        value?.trim()?.takeIf { it.isNotEmpty() }?.let { "$label: $it" }

    private fun listLine(label: String, values: List<String>?): String? =
        values?.filter { it.isNotBlank() }?.takeIf { it.isNotEmpty() }
            ?.let { "$label: ${it.joinToString(", ")}" }

    private fun formatHistory(history: ClinicalHistory?): String? {
        if (history == null) return null
        val personal = history.personalHistory
        val personalText = listOfNotNull(
            personal?.occupation?.takeIf { it.isNotBlank() },
            personal?.diet?.takeIf { it.isNotBlank() },
            personal?.sleep?.takeIf { it.isNotBlank() },
            personal?.exercise?.takeIf { it.isNotBlank() }
        ).joinToString(", ")

        return listOfNotNull(
            line("HPI", history.historyOfPresentIllness),
            listLine("Past medical", history.pastMedicalHistory),
            listLine("Past surgical", history.pastSurgicalHistory),
            listLine("Medicines", history.drugHistory),
            listLine("Allergies", history.allergyHistory),
            line("Family", history.familyHistory),
            line("Personal", personalText),
            line("Review of systems", history.reviewOfSystems)
        ).joinToString("\n\n").takeIf { it.isNotBlank() }
    }

    private fun formatAyush(ayush: AyushHistory?): String? {
        if (ayush == null) return null
        val vihara = ayush.aharaVihara
        return listOfNotNull(
            line("Prakriti", ayush.prakriti),
            line("Vikriti", ayush.vikriti),
            line("Sara", ayush.sara),
            line("Samhanana", ayush.samhanana),
            line("Pramana", ayush.pramana),
            line("Satmya", ayush.satmya),
            line("Sattva", ayush.sattva),
            line("Ahara Shakti (Agni)", ayush.aharaShakti),
            line("Vyayama Shakti", ayush.vyayamaShakti),
            line("Vaya", ayush.vaya),
            line("Koshtha", ayush.koshtha),
            line("Nidana", ayush.nidana),
            line("Diet", vihara?.diet),
            line("Lifestyle", vihara?.lifestyle),
            line("Sleep", vihara?.sleep),
            line("Activity", vihara?.physicalActivity)
        ).joinToString("\n").takeIf { it.isNotBlank() }
    }

    private fun formatDocuments(documents: List<SessionDocument>?): String? {
        if (documents.isNullOrEmpty()) return null

        return documents.joinToString("\n\n") { doc ->
            val header = listOfNotNull(
                doc.documentType?.replace("_", " "),
                doc.date,
                doc.hospital?.takeIf { it.isNotBlank() }
            ).joinToString(" · ")

            val body = listOfNotNull(
                listLine("Diagnoses", doc.diagnoses),
                doc.medicines?.takeIf { it.isNotEmpty() }?.let { meds ->
                    "Medicines: " + meds.joinToString(", ") { m ->
                        listOfNotNull(m.name, m.dosage, m.frequency).joinToString(" ")
                    }
                },
                doc.investigations?.takeIf { it.isNotEmpty() }?.let { tests ->
                    "Investigations: " + tests.joinToString(", ") { t ->
                        val flag = if (t.abnormal == true) " (ABNORMAL)" else ""
                        "${t.name} ${t.value ?: ""}${t.unit ?: ""}$flag".trim()
                    }
                },
                doc.confidence?.let { "OCR confidence: ${(it * 100).toInt()}%" +
                    if (doc.needsVerification == true) " — verify against original" else "" }
            ).joinToString("\n")

            "$header\n$body".trim()
        }
    }

    private fun formatTranscript(session: IntakeSession): String? {
        val turns = session.turns.orEmpty()
        if (turns.isEmpty()) return null
        return turns.joinToString("\n") { turn ->
            val who = if (turn.role == "assistant") "Kiosk" else "Patient"
            "$who: ${turn.text.orEmpty()}"
        }
    }

    override fun onStop() {
        super.onStop()
        player.stop()
    }
}
