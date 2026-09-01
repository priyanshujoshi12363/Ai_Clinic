package com.ayush.doctorapp.activities

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import com.ayush.doctorapp.R
import com.ayush.doctorapp.adapters.DashboardPagerAdapter
import com.ayush.doctorapp.databinding.ActivityDashboardBinding
import com.ayush.doctorapp.utils.TokenManager
import com.google.android.material.tabs.TabLayoutMediator

class DashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDashboardBinding
    private val tokenManager by lazy { TokenManager(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)

        val doctor = tokenManager.getDoctor()
        supportActionBar?.title = doctor?.name?.display()?.let { "Dr. $it" } ?: getString(R.string.dashboard)
        supportActionBar?.subtitle = listOfNotNull(
            doctor?.specialization,
            doctor?.hospital?.hospitalName
        ).joinToString(" · ").ifBlank { getString(R.string.tagline) }

        binding.viewPager.adapter = DashboardPagerAdapter(supportFragmentManager, lifecycle)
        binding.viewPager.offscreenPageLimit = 2

        TabLayoutMediator(binding.tabLayout, binding.viewPager) { tab, position ->
            tab.text = if (position == 0) getString(R.string.tab_opd) else getString(R.string.tab_emergency)
        }.attach()
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.dashboard_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean = when (item.itemId) {
        R.id.action_profile -> {
            startActivity(Intent(this, ProfileActivity::class.java))
            true
        }
        R.id.action_logout -> {
            tokenManager.clear()
            startActivity(Intent(this, LoginActivity::class.java))
            finishAffinity()
            true
        }
        else -> super.onOptionsItemSelected(item)
    }
}
