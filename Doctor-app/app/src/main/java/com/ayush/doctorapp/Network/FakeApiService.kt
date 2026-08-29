package com.ayush.doctorapp.Network

import com.ayush.doctorapp.Models.AccountInfo
import com.ayush.doctorapp.Models.AccountRegister
import com.ayush.doctorapp.Models.Address
import com.ayush.doctorapp.Models.Allergy
import com.ayush.doctorapp.Models.ApiResponse
import com.ayush.doctorapp.Models.AyushHistory
import com.ayush.doctorapp.Models.ChangePasswordRequest
import com.ayush.doctorapp.Models.ClinicalHistory
import com.ayush.doctorapp.Models.Condition
import com.ayush.doctorapp.Models.ContactInfo
import com.ayush.doctorapp.Models.ConsultationInfo
import com.ayush.doctorapp.Models.Doctor
import com.ayush.doctorapp.Models.DoctorName
import com.ayush.doctorapp.Models.DoctorReview
import com.ayush.doctorapp.Models.FaceData
import com.ayush.doctorapp.Models.FaceImage
import com.ayush.doctorapp.Models.FaceRecognition
import com.ayush.doctorapp.Models.FaceSearchRequest
import com.ayush.doctorapp.Models.FaceSearchResponse
import com.ayush.doctorapp.Models.FamilyHistory
import com.ayush.doctorapp.Models.HospitalInfo
import com.ayush.doctorapp.Models.Lifestyle
import com.ayush.doctorapp.Models.LoginRequest
import com.ayush.doctorapp.Models.LoginResponse
import com.ayush.doctorapp.Models.MedicalHistory
import com.ayush.doctorapp.Models.Patient
import com.ayush.doctorapp.Models.RegisterRequest
import com.ayush.doctorapp.Models.Surgery
import com.ayush.doctorapp.Models.Visit
import kotlinx.coroutines.delay
import retrofit2.Response

class FakeApiService : ApiService {

    override suspend fun registerDoctor(request: RegisterRequest): Response<ApiResponse<LoginResponse>> {
        delay(400)
        return success(
            loginResponse(
                username = request.account.username,
                role = request.account.role
            )
        )
    }

    override suspend fun loginDoctor(request: LoginRequest): Response<ApiResponse<LoginResponse>> {
        delay(500)
        if (request.username == "admin" && request.password == "admin@123") {
            return success(loginResponse(username = "admin", role = "ADMIN"))
        }
        return Response.success(
            ApiResponse(
                success = false,
                message = "Invalid credentials. Use admin / admin@123",
                data = null,
                count = null
            )
        )
    }

    override suspend fun getProfile(token: String): Response<ApiResponse<Doctor>> {
        delay(300)
        return success(fakeDoctor())
    }

    override suspend fun updateProfile(
        token: String,
        doctor: Doctor
    ): Response<ApiResponse<Doctor>> {
        delay(300)
        return success(doctor)
    }

    override suspend fun changePassword(
        token: String,
        request: ChangePasswordRequest
    ): Response<ApiResponse<Unit>> {
        delay(300)
        return success(Unit, "Password changed")
    }

    override suspend fun logout(token: String): Response<ApiResponse<Unit>> {
        delay(200)
        return success(Unit, "Logged out")
    }

    override suspend fun getPatients(token: String): Response<ApiResponse<List<Patient>>> {
        delay(600)
        return success(fakePatients(), "Loaded ${fakePatients().size} patients", fakePatients().size)
    }

    override suspend fun getPatientById(
        token: String,
        abhaId: String
    ): Response<ApiResponse<Patient>> {
        delay(400)
        val match = fakePatients().firstOrNull { it.abhaId == abhaId }
        return if (match != null) {
            success(match)
        } else {
            Response.success(
                ApiResponse(
                    success = false,
                    message = "Patient not found",
                    data = null,
                    count = null
                )
            )
        }
    }

    override suspend fun searchByFace(
        token: String,
        request: FaceSearchRequest
    ): Response<ApiResponse<FaceSearchResponse>> {
        delay(500)
        val patient = fakePatients().first()
        return success(
            FaceSearchResponse(
                found = true,
                confidence = 0.93,
                data = patient
            )
        )
    }

    private fun <T> success(
        data: T,
        message: String? = "Success",
        count: Int? = null
    ): Response<ApiResponse<T>> = Response.success(
        ApiResponse(
            success = true,
            message = message,
            data = data,
            count = count
        )
    )

    private fun loginResponse(username: String, role: String): LoginResponse {
        return LoginResponse(
            token = "fake-jwt-token-${System.currentTimeMillis()}",
            doctorId = "DOC001",
            name = DoctorName(
                firstName = "Admin",
                middleName = null,
                lastName = "User"
            ),
            email = "admin@ayush.gov.in",
            username = username,
            role = role,
            specialization = "General Medicine",
            hospital = HospitalInfo(
                hospitalId = "HOSP_001",
                hospitalName = "All India Institute of Ayurveda",
                departmentId = "DEPT_001",
                departmentName = "General OPD"
            )
        )
    }

    private fun fakeDoctor(): Doctor {
        return Doctor(
            doctorId = "DOC001",
            name = DoctorName(firstName = "Admin", middleName = null, lastName = "User"),
            registrationNumber = "REG-AIIA-2024-001",
            specialization = "General Medicine",
            hospital = HospitalInfo(
                hospitalId = "HOSP_001",
                hospitalName = "All India Institute of Ayurveda",
                departmentId = "DEPT_001",
                departmentName = "General OPD"
            ),
            contact = ContactInfo(
                mobile = "+91 9876543210",
                email = "admin@ayush.gov.in"
            ),
            consultation = ConsultationInfo(types = listOf("GENERAL_OPD", "AYUSH")),
            account = AccountInfo(
                username = "admin",
                role = "ADMIN",
                active = true,
                lastLogin = "2026-08-28T10:30:00Z"
            ),
            createdAt = "2024-01-15T08:00:00Z",
            updatedAt = "2026-08-28T10:30:00Z"
        )
    }

    private fun fakePatients(): List<Patient> {
        return listOf(
            Patient(
                abhaId = "14-3344-5566-7788",
                aadhaarNumber = "XXXX-XXXX-1234",
                name = "Rajesh Kumar",
                dateOfBirth = "1985-03-12",
                gender = "Male",
                mobile = "+91 9988776655",
                email = "rajesh.kumar@example.com",
                address = Address(
                    house = "12/A",
                    street = "MG Road",
                    locality = "Connaught Place",
                    village = null,
                    district = "New Delhi",
                    state = "Delhi",
                    pincode = "110001",
                    country = "India"
                ),
                faceData = FaceData(
                    faceEmbedding = null,
                    faceImages = listOf(
                        FaceImage(
                            imageId = "F001",
                            imageUrl = "https://example.com/face1.jpg",
                            capturedAt = "2026-08-15T09:00:00Z",
                            isPrimary = true
                        )
                    ),
                    recognition = FaceRecognition(
                        enabled = true,
                        verificationCount = 5,
                        lastVerified = "2026-08-28T09:15:00Z"
                    )
                ),
                medicalHistory = MedicalHistory(
                    conditions = listOf(
                        Condition("Hypertension", "2020-06-15", "Active"),
                        Condition("Type 2 Diabetes", "2019-11-20", "Managed")
                    ),
                    allergies = listOf(
                        Allergy("Penicillin", "Rash", "Moderate"),
                        Allergy("Peanuts", "Anaphylaxis", "Severe")
                    ),
                    surgeries = listOf(
                        Surgery("Appendectomy", "2015-04-10", "AIIMS Delhi")
                    ),
                    familyHistory = listOf(
                        FamilyHistory("Diabetes", "Father"),
                        FamilyHistory("Heart Disease", "Mother")
                    ),
                    lifestyle = Lifestyle(
                        smoking = false,
                        alcohol = false,
                        exercise = "Occasional",
                        diet = "Mixed"
                    )
                ),
                visits = listOf(
                    Visit(
                        visitId = "V001",
                        date = "2026-08-28T09:30:00Z",
                        hospitalName = "All India Institute of Ayurveda",
                        consultationType = "GENERAL_OPD",
                        clinicalHistory = ClinicalHistory(
                            chiefComplaint = "Chest discomfort and fatigue for 2 weeks",
                            historyOfPresentIllness = "Patient reports intermittent chest pain radiating to left arm, associated with fatigue and shortness of breath on exertion.",
                            pastMedicalHistory = listOf("Hypertension since 2020", "Type 2 Diabetes since 2019"),
                            drugHistory = listOf("Amlodipine 5mg OD", "Metformin 500mg BD"),
                            allergyHistory = listOf("Penicillin - rash"),
                            familyHistory = "Father - Diabetes, Mother - Heart Disease"
                        ),
                        ayushHistory = AyushHistory(
                            prakriti = "Vata-Pitta",
                            vikriti = "Pitta predominant",
                            diet = "Vegetarian",
                            sleep = "Disturbed",
                            lifestyle = "Sedentary"
                        ),
                        aiSummary = "45-year-old male with known hypertension and diabetes presenting with 2-week history of chest discomfort. Symptoms suggest possible cardiac etiology - ECG and troponin recommended. Current medications: Amlodipine 5mg, Metformin 500mg BD. Allergies: Penicillin (rash), Peanuts (anaphylaxis - severe). BP and blood sugar monitoring advised.",
                        doctorReview = DoctorReview(
                            doctorId = "DOC001",
                            doctorName = "Dr. Admin User",
                            verified = false,
                            notes = null,
                            verifiedAt = null
                        )
                    )
                ),
                activeStatus = true,
                totalVisits = 1
            ),
            Patient(
                abhaId = "14-7788-9900-1122",
                aadhaarNumber = "XXXX-XXXX-5678",
                name = "Priya Sharma",
                dateOfBirth = "1992-07-25",
                gender = "Female",
                mobile = "+91 8877665544",
                email = "priya.sharma@example.com",
                address = Address(
                    house = "45",
                    street = "Park Street",
                    locality = "Salt Lake",
                    village = null,
                    district = "Kolkata",
                    state = "West Bengal",
                    pincode = "700091",
                    country = "India"
                ),
                faceData = FaceData(
                    faceEmbedding = null,
                    faceImages = emptyList(),
                    recognition = FaceRecognition(
                        enabled = false,
                        verificationCount = 0,
                        lastVerified = null
                    )
                ),
                medicalHistory = MedicalHistory(
                    conditions = listOf(
                        Condition("Migraine", "2018-03-10", "Recurrent")
                    ),
                    allergies = emptyList(),
                    surgeries = emptyList(),
                    familyHistory = emptyList(),
                    lifestyle = Lifestyle(
                        smoking = false,
                        alcohol = false,
                        exercise = "Regular",
                        diet = "Vegetarian"
                    )
                ),
                visits = listOf(
                    Visit(
                        visitId = "V002",
                        date = "2026-08-27T14:00:00Z",
                        hospitalName = "All India Institute of Ayurveda",
                        consultationType = "AYUSH",
                        clinicalHistory = ClinicalHistory(
                            chiefComplaint = "Recurrent headaches, 3-4 episodes per month",
                            historyOfPresentIllness = "Patient has been experiencing unilateral throbbing headaches associated with photophobia and nausea, lasting 6-12 hours.",
                            pastMedicalHistory = listOf("Migraine since 2018"),
                            drugHistory = listOf("Sumatriptan 50mg PRN"),
                            allergyHistory = emptyList(),
                            familyHistory = "Mother - Migraine"
                        ),
                        ayushHistory = AyushHistory(
                            prakriti = "Pitta predominant",
                            vikriti = "Pitta aggravation",
                            diet = "Spicy, irregular meals",
                            sleep = "Late sleeping",
                            lifestyle = "High stress (IT professional)"
                        ),
                        aiSummary = "34-year-old female with known migraine presenting with increased frequency. Triggers: irregular sleep, stress, spicy food. Pitta-predominant prakriti with current vitiation. Recommend lifestyle modifications, regular meal timings, and Shirodhara therapy. Continue Sumatriptan for acute episodes.",
                        doctorReview = DoctorReview(
                            doctorId = "DOC001",
                            doctorName = "Dr. Admin User",
                            verified = true,
                            notes = "Started on prophylactic Propranolol. Referred for Shirodhara.",
                            verifiedAt = "2026-08-27T15:30:00Z"
                        )
                    )
                ),
                activeStatus = true,
                totalVisits = 1
            ),
            Patient(
                abhaId = "14-2233-4455-6677",
                aadhaarNumber = "XXXX-XXXX-9012",
                name = "Mohammed Aslam",
                dateOfBirth = "1970-11-08",
                gender = "Male",
                mobile = "+91 7766554433",
                email = null,
                address = Address(
                    house = "78",
                    street = "Anna Salai",
                    locality = "T. Nagar",
                    village = null,
                    district = "Chennai",
                    state = "Tamil Nadu",
                    pincode = "600017",
                    country = "India"
                ),
                faceData = FaceData(
                    faceEmbedding = null,
                    faceImages = listOf(
                        FaceImage(
                            imageId = "F003",
                            imageUrl = "https://example.com/face3.jpg",
                            capturedAt = "2026-08-20T11:00:00Z",
                            isPrimary = true
                        )
                    ),
                    recognition = FaceRecognition(
                        enabled = true,
                        verificationCount = 3,
                        lastVerified = "2026-08-20T11:05:00Z"
                    )
                ),
                medicalHistory = MedicalHistory(
                    conditions = listOf(
                        Condition("COPD", "2017-05-22", "Active"),
                        Condition("Coronary Artery Disease", "2021-09-10", "Active")
                    ),
                    allergies = listOf(
                        Allergy("Aspirin", "Bronchospasm", "Severe")
                    ),
                    surgeries = listOf(
                        Surgery("CABG", "2021-10-15", "Apollo Hospital Chennai")
                    ),
                    familyHistory = listOf(
                        FamilyHistory("Heart Disease", "Father"),
                        FamilyHistory("Diabetes", "Both parents")
                    ),
                    lifestyle = Lifestyle(
                        smoking = true,
                        alcohol = false,
                        exercise = "Limited",
                        diet = "Non-vegetarian"
                    )
                ),
                visits = listOf(
                    Visit(
                        visitId = "V003",
                        date = "2026-08-26T11:30:00Z",
                        hospitalName = "All India Institute of Ayurveda",
                        consultationType = "GENERAL_OPD",
                        clinicalHistory = ClinicalHistory(
                            chiefComplaint = "Increased breathlessness and cough with sputum for 5 days",
                            historyOfPresentIllness = "Known COPD and CAD patient on regular medications, now with exacerbation of respiratory symptoms. Low-grade fever present. Sputum is yellowish.",
                            pastMedicalHistory = listOf(
                                "COPD since 2017",
                                "CABG done in 2021",
                                "Coronary Artery Disease"
                            ),
                            drugHistory = listOf(
                                "Tiotropium inhaler",
                                "Salbutamol PRN",
                                "Atorvastatin 40mg HS",
                                "Clopidogrel 75mg OD"
                            ),
                            allergyHistory = listOf("Aspirin - severe bronchospasm"),
                            familyHistory = "Strong family history of cardiac disease"
                        ),
                        ayushHistory = AyushHistory(
                            prakriti = "Kapha-Vata",
                            vikriti = "Kapha aggravation",
                            diet = "Heavy, cold foods",
                            sleep = "Adequate",
                            lifestyle = "Sedentary, former smoker"
                        ),
                        aiSummary = "55-year-old male, known case of COPD and post-CABG status, presenting with acute exacerbation. Likely infective exacerbation - sputum culture and chest X-ray recommended. Start empirical antibiotics. AVOID aspirin/NSAIDs - severe allergy. Continue cardiac and COPD medications. Consider pulmonary rehabilitation.",
                        doctorReview = DoctorReview(
                            doctorId = "DOC001",
                            doctorName = "Dr. Admin User",
                            verified = true,
                            notes = "Started on Augmentin 625mg BD for 7 days. CXR and sputum culture sent. Nebulization advised.",
                            verifiedAt = "2026-08-26T13:00:00Z"
                        )
                    )
                ),
                activeStatus = true,
                totalVisits = 1
            ),
            Patient(
                abhaId = "14-5566-7788-9900",
                aadhaarNumber = "XXXX-XXXX-3456",
                name = "Anjali Verma",
                dateOfBirth = "1998-01-30",
                gender = "Female",
                mobile = "+91 9090909090",
                email = "anjali.verma@example.com",
                address = Address(
                    house = "23/B",
                    street = "Civil Lines",
                    locality = "Model Town",
                    village = null,
                    district = "Jaipur",
                    state = "Rajasthan",
                    pincode = "302006",
                    country = "India"
                ),
                faceData = FaceData(
                    faceEmbedding = null,
                    faceImages = emptyList(),
                    recognition = FaceRecognition(
                        enabled = false,
                        verificationCount = 0,
                        lastVerified = null
                    )
                ),
                medicalHistory = MedicalHistory(
                    conditions = listOf(
                        Condition("Iron deficiency anemia", "2023-08-12", "Active")
                    ),
                    allergies = emptyList(),
                    surgeries = emptyList(),
                    familyHistory = emptyList(),
                    lifestyle = Lifestyle(
                        smoking = false,
                        alcohol = false,
                        exercise = "Regular",
                        diet = "Vegetarian, low iron intake"
                    )
                ),
                visits = listOf(
                    Visit(
                        visitId = "V004",
                        date = "2026-08-25T16:00:00Z",
                        hospitalName = "All India Institute of Ayurveda",
                        consultationType = "AYUSH",
                        clinicalHistory = ClinicalHistory(
                            chiefComplaint = "Fatigue and weakness for 2 months",
                            historyOfPresentIllness = "Young female with fatigue, giddiness on exertion, and pallor. Menstrual cycles regular but heavy flow. Diet history reveals low iron intake.",
                            pastMedicalHistory = listOf("Iron deficiency anemia"),
                            drugHistory = listOf("Iron supplements (irregular)"),
                            allergyHistory = emptyList(),
                            familyHistory = "No significant family history"
                        ),
                        ayushHistory = AyushHistory(
                            prakriti = "Vata predominant",
                            vikriti = "Vata-Pitta",
                            diet = "Inadequate, vegetarian with low iron sources",
                            sleep = "Regular",
                            lifestyle = "Active, college student"
                        ),
                        aiSummary = "28-year-old female with iron deficiency anemia, likely nutritional and menstrual loss related. Counsel on iron-rich diet. Recommend Hb monitoring. Ayurvedic supplements like Punarnava and Dadimadi Ghrita may help. Regular iron supplementation needed.",
                        doctorReview = DoctorReview(
                            doctorId = "DOC001",
                            doctorName = "Dr. Admin User",
                            verified = true,
                            notes = "Referred to gynecology for heavy menstrual flow evaluation. Iron supplements prescribed.",
                            verifiedAt = "2026-08-25T17:00:00Z"
                        )
                    )
                ),
                activeStatus = true,
                totalVisits = 1
            ),
            Patient(
                abhaId = "14-8899-0011-2233",
                aadhaarNumber = "XXXX-XXXX-7890",
                name = "Suresh Patil",
                dateOfBirth = "1965-05-18",
                gender = "Male",
                mobile = "+91 9654321098",
                email = "suresh.patil@example.com",
                address = Address(
                    house = "67",
                    street = "FC Road",
                    locality = "Shivajinagar",
                    village = null,
                    district = "Pune",
                    state = "Maharashtra",
                    pincode = "411005",
                    country = "India"
                ),
                faceData = FaceData(
                    faceEmbedding = null,
                    faceImages = listOf(
                        FaceImage(
                            imageId = "F005",
                            imageUrl = "https://example.com/face5.jpg",
                            capturedAt = "2026-08-22T08:00:00Z",
                            isPrimary = true
                        )
                    ),
                    recognition = FaceRecognition(
                        enabled = true,
                        verificationCount = 8,
                        lastVerified = "2026-08-27T08:30:00Z"
                    )
                ),
                medicalHistory = MedicalHistory(
                    conditions = listOf(
                        Condition("Knee osteoarthritis (bilateral)", "2022-01-10", "Active"),
                        Condition("Hypertension", "2018-07-05", "Managed")
                    ),
                    allergies = emptyList(),
                    surgeries = listOf(
                        Surgery("Right knee arthroscopy", "2023-03-15", "Deenanath Mangeshkar Hospital")
                    ),
                    familyHistory = listOf(
                        FamilyHistory("Osteoarthritis", "Mother")
                    ),
                    lifestyle = Lifestyle(
                        smoking = false,
                        alcohol = false,
                        exercise = "Limited due to knee pain",
                        diet = "Mixed, traditional Maharashtrian"
                    )
                ),
                visits = listOf(
                    Visit(
                        visitId = "V005",
                        date = "2026-08-24T10:00:00Z",
                        hospitalName = "All India Institute of Ayurveda",
                        consultationType = "AYUSH",
                        clinicalHistory = ClinicalHistory(
                            chiefComplaint = "Severe bilateral knee pain, difficulty walking for 3 months",
                            historyOfPresentIllness = "Known case of bilateral knee osteoarthritis, right knee arthroscopy done in 2023. Pain has worsened, especially in mornings and after walking. Currently on analgesics with limited relief.",
                            pastMedicalHistory = listOf("Bilateral knee OA", "Hypertension"),
                            drugHistory = listOf("Telmisartan 40mg OD", "Paracetamol PRN"),
                            allergyHistory = emptyList(),
                            familyHistory = "Mother had severe knee OA"
                        ),
                        ayushHistory = AyushHistory(
                            prakriti = "Vata predominant",
                            vikriti = "Vata aggravation",
                            diet = "Vata-aggravating (dry, cold foods)",
                            sleep = "Disturbed due to pain",
                            lifestyle = "Sedentary due to pain"
                        ),
                        aiSummary = "61-year-old male with progressive bilateral knee osteoarthritis. Conservative management failing - consider Panchakarma (Janu Basti, Abhyanga) for pain relief and improved mobility. Weight management and specific exercises (quadriceps strengthening) recommended. Ayurvedic external therapies may delay surgical intervention.",
                        doctorReview = DoctorReview(
                            doctorId = "DOC001",
                            doctorName = "Dr. Admin User",
                            verified = true,
                            notes = "Planned for Janu Basti course (7 days). Physiotherapy referral for quadriceps strengthening.",
                            verifiedAt = "2026-08-24T11:30:00Z"
                        )
                    )
                ),
                activeStatus = true,
                totalVisits = 1
            )
        )
    }
}
