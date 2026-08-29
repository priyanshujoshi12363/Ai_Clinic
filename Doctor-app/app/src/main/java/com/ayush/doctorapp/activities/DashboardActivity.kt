package com.ayush.doctorapp.activities

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.viewpager2.widget.ViewPager2
import com.google.android.material.tabs.TabLayoutMediator
import com.ayush.doctorapp.R
import com.ayush.doctorapp.adapters.DashboardPagerAdapter
import com.ayush.doctorapp.databinding.ActivityDashboardBinding
import com.ayush.doctorapp.fragments.EmergencyListFragment
import com.ayush.doctorapp.fragments.PatientListFragment
import com.ayush.doctorapp.utils.TokenManager

class DashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDashboardBinding
    private lateinit var pagerAdapter: DashboardPagerAdapter
    private val tokenManager = TokenManager(this)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupTabs()
        setupReloadButton()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Doctor Dashboard"
    }

    private fun setupTabs() {
        pagerAdapter = DashboardPagerAdapter(supportFragmentManager, lifecycle)
        binding.viewPager.adapter = pagerAdapter

        TabLayoutMediator(binding.tabLayout, binding.viewPager) { tab, position ->
            tab.text = when (position) {
                0 -> "👨‍⚕️ Patients"
                1 -> "🚨 Emergency"
                else -> "Patients"
            }
        }.attach()
    }

    private fun setupReloadButton() {
        binding.fabReload.setOnClickListener {
            val currentItem = binding.viewPager.currentItem
            when (currentItem) {
                0 -> {
                    val fragment = supportFragmentManager.findFragmentByTag("f0")
                    if (fragment is PatientListFragment) {
                        fragment.refreshData()
                    }
                }
                1 -> {
                    val fragment = supportFragmentManager.findFragmentByTag("f1")
                    if (fragment is EmergencyListFragment) {
                        fragment.refreshData()
                    }
                }
            }
        }
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