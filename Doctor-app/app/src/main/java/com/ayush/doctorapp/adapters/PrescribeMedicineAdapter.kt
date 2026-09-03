package com.ayush.doctorapp.adapters

import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.recyclerview.widget.RecyclerView
import com.ayush.doctorapp.databinding.ItemPrescribeMedicineBinding

/** A single, editable medicine line the doctor is prescribing. */
data class MedRow(
    val display: String,          // "Azithromycin 500 mg"
    val name: String,             // "Azithromycin"
    val dosage: String,           // "500 mg"
    var frequency: String,
    var timing: String,
    var duration: String
)

class PrescribeMedicineAdapter(
    val rows: MutableList<MedRow> = mutableListOf(),
    private val onChanged: () -> Unit
) : RecyclerView.Adapter<PrescribeMedicineAdapter.Holder>() {

    private val timings = arrayOf(
        "After food", "Before food", "Empty stomach", "With food", "At bedtime", "As needed"
    )

    fun add(row: MedRow) {
        rows.add(row)
        notifyItemInserted(rows.size - 1)
        onChanged()
    }

    inner class Holder(val b: ItemPrescribeMedicineBinding) : RecyclerView.ViewHolder(b.root) {
        var freqW: TextWatcher? = null
        var timeW: TextWatcher? = null
        var durW: TextWatcher? = null
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val b = ItemPrescribeMedicineBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        b.etTiming.setAdapter(ArrayAdapter(parent.context, android.R.layout.simple_list_item_1, timings))
        return Holder(b)
    }

    override fun getItemCount() = rows.size

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val row = rows[position]
        holder.b.tvMedName.text = row.display

        holder.b.etFrequency.removeTextChangedListener(holder.freqW)
        holder.b.etTiming.removeTextChangedListener(holder.timeW)
        holder.b.etDuration.removeTextChangedListener(holder.durW)

        holder.b.etFrequency.setText(row.frequency)
        holder.b.etTiming.setText(row.timing, false)
        holder.b.etDuration.setText(row.duration)

        holder.freqW = watch { row.frequency = it }.also { holder.b.etFrequency.addTextChangedListener(it) }
        holder.timeW = watch { row.timing = it }.also { holder.b.etTiming.addTextChangedListener(it) }
        holder.durW = watch { row.duration = it }.also { holder.b.etDuration.addTextChangedListener(it) }

        holder.b.btnRemove.setOnClickListener {
            val p = holder.bindingAdapterPosition
            if (p != RecyclerView.NO_POSITION) {
                rows.removeAt(p)
                notifyItemRemoved(p)
                onChanged()
            }
        }
    }

    private fun watch(onText: (String) -> Unit) = object : TextWatcher {
        override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
        override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
        override fun afterTextChanged(s: Editable?) { onText(s?.toString().orEmpty()) }
    }
}
