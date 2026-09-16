import React from "react";
import { motion } from "framer-motion";

export default function StatsCard({
  title,
  value,
  color = "text-blue-600",
  bgColor = "bg-blue-50",
  borderColor = "border-slate-200",
  icon: Icon,
  isActive = false,
  onClick,
  trend = "+12.5%",
  trendPositive = true,
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group relative w-full overflow-hidden rounded-xl border p-5 text-left transition-all duration-150 ${
        onClick ? "cursor-pointer hover:border-slate-300 hover:shadow-md" : ""
      } ${
        isActive
          ? "border-blue-600 ring-2 ring-blue-100 bg-blue-50/30"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trendPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {trend}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${bgColor} ${color} border-slate-100/80 shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.button>
  );
}