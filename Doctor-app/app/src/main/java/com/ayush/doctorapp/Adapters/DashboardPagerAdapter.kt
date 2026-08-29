package com.ayush.doctorapp.adapters

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.Lifecycle
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.ayush.doctorapp.fragments.EmergencyListFragment
import com.ayush.doctorapp.fragments.PatientListFragment

class DashboardPagerAdapter(
    fragmentManager: FragmentManager,
    lifecycle: Lifecycle
) : FragmentStateAdapter(fragmentManager, lifecycle) {

    override fun getItemCount(): Int = 2

    override fun createFragment(position: Int): Fragment {
        return when (position) {
            0 -> PatientListFragment()
            1 -> EmergencyListFragment()
            else -> PatientListFragment()
        }
    }
}