package com.ayush.doctorapp.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class Patient(
    val abhaId: String,
    val aadhaarNumber: String,
    val name: String,
    val dateOfBirth: String,
    val gender: String,
    val mobile: String,
    val email: String?,
    val address: Address?,
    val faceData: FaceData?,
    val medicalHistory: MedicalHistory?,
    val visits: List<Visit>?,
    val activeStatus: Boolean,
    val totalVisits: Int
) : Parcelable

@Parcelize
data class Address(
    val house: String?,
    val street: String?,
    val locality: String?,
    val village: String?,
    val district: String?,
    val state: String?,
    val pincode: String?,
    val country: String?
) : Parcelable

@Parcelize
data class FaceData(
    val faceEmbedding: List<Double>?,
    val faceImages: List<FaceImage>?,
    val recognition: FaceRecognition?
) : Parcelable

@Parcelize
data class FaceImage(
    val imageId: String,
    val imageUrl: String,
    val capturedAt: String,
    val isPrimary: Boolean
) : Parcelable

@Parcelize
data class FaceRecognition(
    val enabled: Boolean,
    val verificationCount: Int,
    val lastVerified: String?
) : Parcelable

@Parcelize
data class MedicalHistory(
    val conditions: List<Condition>?,
    val allergies: List<Allergy>?,
    val surgeries: List<Surgery>?,
    val familyHistory: List<FamilyHistory>?,
    val lifestyle: Lifestyle?
) : Parcelable

@Parcelize
data class Condition(
    val name: String,
    val diagnosedDate: String?,
    val status: String?
) : Parcelable

@Parcelize
data class Allergy(
    val allergen: String,
    val reaction: String?,
    val severity: String?
) : Parcelable

@Parcelize
data class Surgery(
    val procedure: String,
    val date: String?,
    val hospital: String?
) : Parcelable

@Parcelize
data class FamilyHistory(
    val condition: String,
    val relation: String
) : Parcelable

@Parcelize
data class Lifestyle(
    val smoking: Boolean,
    val alcohol: Boolean,
    val exercise: String?,
    val diet: String?
) : Parcelable

@Parcelize
data class Visit(
    val visitId: String,
    val date: String,
    val hospitalName: String,
    val consultationType: String,
    val clinicalHistory: ClinicalHistory?,
    val ayushHistory: AyushHistory?,
    val aiSummary: String?,
    val doctorReview: DoctorReview?
) : Parcelable

@Parcelize
data class ClinicalHistory(
    val chiefComplaint: String?,
    val historyOfPresentIllness: String?,
    val pastMedicalHistory: List<String>?,
    val drugHistory: List<String>?,
    val allergyHistory: List<String>?,
    val familyHistory: String?
) : Parcelable

@Parcelize
data class AyushHistory(
    val prakriti: String?,
    val vikriti: String?,
    val diet: String?,
    val sleep: String?,
    val lifestyle: String?
) : Parcelable

@Parcelize
data class DoctorReview(
    val doctorId: String?,
    val doctorName: String?,
    val verified: Boolean,
    val notes: String?,
    val verifiedAt: String?
) : Parcelable