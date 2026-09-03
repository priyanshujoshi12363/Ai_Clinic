package com.ayush.doctorapp.models

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize

data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?,
    val count: Int?
)

data class LoginRequest(
    val username: String,
    val password: String
)

data class DoctorName(
    val firstName: String?,
    val middleName: String?,
    val lastName: String?
) {
    fun display(): String = listOfNotNull(firstName, lastName)
        .filter { it.isNotBlank() }
        .joinToString(" ")
        .ifBlank { "Doctor" }
}

data class HospitalInfo(
    val hospitalId: String?,
    val hospitalName: String?,
    val departmentId: String?,
    val departmentName: String?
)

data class ContactInfo(
    val mobile: String?,
    val email: String?
)

data class ConsultationInfo(
    val types: List<String>?
)

data class AccountRegister(
    val username: String,
    val password: String,
    val role: String = "DOCTOR"
)

data class AccountInfo(
    val username: String?,
    val role: String?,
    val active: Boolean?,
    val lastLogin: String?
)

data class LoginResponse(
    val token: String,
    val doctorId: String?,
    val name: DoctorName?,
    val email: String?,
    val username: String?,
    val role: String?,
    val specialization: String?,
    val hospital: HospitalInfo?
)

data class RegisterRequest(
    val doctorId: String,
    val name: DoctorName,
    val registrationNumber: String,
    val specialization: String,
    val hospital: HospitalInfo,
    val contact: ContactInfo,
    val consultation: ConsultationInfo,
    val account: AccountRegister
)

data class Doctor(
    val doctorId: String?,
    val name: DoctorName?,
    val registrationNumber: String?,
    val specialization: String?,
    val hospital: HospitalInfo?,
    val contact: ContactInfo?,
    val consultation: ConsultationInfo?,
    val account: AccountInfo?
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

@Parcelize
data class OpdCase(
    val appointmentId: String?,
    val tokenNumber: String?,
    val sessionId: String?,
    val abhaId: String?,
    val name: String?,
    val gender: String?,
    val dateOfBirth: String?,
    val mode: String?,
    val language: String?,
    val chiefComplaint: String?,
    val summary: String?,
    val keyPoints: List<String>?,
    val redFlags: List<String>?,
    val urgency: String?,
    val reviewStatus: String?,
    val completedAt: String?
) : Parcelable {
    val isAyush: Boolean get() = mode == "AYUSH"
    val hasRedFlags: Boolean get() = !redFlags.isNullOrEmpty()
}

@Parcelize
data class EmergencyAnswer(
    val key: String?,
    val question: String?,
    val answer: String?,
    val language: String?
) : Parcelable

@Parcelize
data class KnownHistory(
    val conditions: List<String>?,
    val allergies: List<String>?,
    val medicines: List<String>?,
    val lastVisitDate: String?
) : Parcelable

@Parcelize
data class EmergencyCase(
    val tokenNumber: String?,
    val patientName: String?,
    val abhaId: String?,
    val identificationStatus: String?,
    val symptoms: String?,
    val chiefComplaint: String?,
    val language: String?,
    val triageLevel: String?,
    val triageLabel: String?,
    val targetMinutes: Int?,
    val urgency: String?,
    val suspectedCategory: String?,
    val redFlags: List<String>?,
    val aiSummary: String?,
    val keyPoints: List<String>?,
    val doctorBriefing: String?,
    val answers: List<EmergencyAnswer>?,
    val knownHistory: KnownHistory?,
    val queuePosition: Int?,
    val status: String?,
    val waitingMinutes: Int?,
    val breachedTarget: Boolean?,
    val createdAt: String?
) : Parcelable

data class StatusUpdate(
    val status: String,
    val attendedBy: String? = null
)

data class BriefingRequest(
    val language: String = "en-IN"
)

data class BriefingResponse(
    val text: String?,
    val audios: List<String>?,
    val format: String?,
    val language: String?
)

data class PersonalHistory(
    val occupation: String?,
    val diet: String?,
    val sleep: String?,
    val exercise: String?
)

data class ClinicalHistory(
    val chiefComplaint: String?,
    val historyOfPresentIllness: String?,
    val pastMedicalHistory: List<String>?,
    val pastSurgicalHistory: List<String>?,
    val drugHistory: List<String>?,
    val allergyHistory: List<String>?,
    val familyHistory: String?,
    val personalHistory: PersonalHistory?,
    val reviewOfSystems: String?
)

data class AharaVihara(
    val diet: String?,
    val lifestyle: String?,
    val sleep: String?,
    val physicalActivity: String?
)

data class AyushHistory(
    val prakriti: String?,
    val vikriti: String?,
    val sara: String?,
    val samhanana: String?,
    val pramana: String?,
    val satmya: String?,
    val sattva: String?,
    val aharaShakti: String?,
    val vyayamaShakti: String?,
    val vaya: String?,
    val aharaVihara: AharaVihara?,
    val nidana: String?,
    val koshtha: String?
)

data class ExtractedMedicine(
    val name: String?,
    val dosage: String?,
    val frequency: String?,
    val duration: String?
)

data class ExtractedInvestigation(
    val name: String?,
    val value: String?,
    val unit: String?,
    val referenceRange: String?,
    val abnormal: Boolean?
)

data class SessionDocument(
    val documentId: String?,
    val fileUrl: String?,
    val documentType: String?,
    val date: String?,
    val hospital: String?,
    val diagnoses: List<String>?,
    val medicines: List<ExtractedMedicine>?,
    val investigations: List<ExtractedInvestigation>?,
    val confidence: Double?,
    val needsVerification: Boolean?
)

data class InterviewTurn(
    val role: String?,
    val text: String?,
    val section: String?
)

data class IntakeSession(
    val sessionId: String?,
    val abhaId: String?,
    val patientName: String?,
    val language: String?,
    val mode: String?,
    val stage: String?,
    @SerializedName("turns") val turns: List<InterviewTurn>?,
    val documents: List<SessionDocument>?,
    val redFlags: List<String>?,
    val urgency: String?,
    val summary: String?,
    val chiefComplaint: String?,
    val keyPoints: List<String>?,
    val clinicalHistory: ClinicalHistory?,
    val ayushHistory: AyushHistory?,
    val voiceBriefing: String?,
    val tokenNumber: String?,
    val identificationMethod: String?,
    val completedAt: String?
)

// ---- Prescription / medicine master (Doctor prescribes here) ----
data class Medicine(
    @SerializedName("_id") val id: String?,
    val name: String,
    val generic: String?,
    val form: String?,
    val strength: String?,
    val category: String?,
    val defaultFrequency: String?,
    val defaultTiming: String?,
    val defaultDuration: String?,
    val system: String?
)

data class PrescriptionMedicineInput(
    val name: String,
    val dosage: String?,
    val frequency: String?,
    val timing: String?,
    val duration: String?,
    val quantity: Int? = null
)

data class CreatePrescriptionRequest(
    val doctorName: String,
    val specialty: String?,
    val diagnosis: String?,
    val instructions: String?,
    val medicines: List<PrescriptionMedicineInput>
)

data class PrescriptionResult(
    val totalPrescriptions: Int?
)
