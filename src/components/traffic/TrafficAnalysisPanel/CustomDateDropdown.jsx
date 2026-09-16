import React, { useState, useEffect, useMemo, useRef } from "react";
import { Activity, ArrowUp, ArrowDown, AlertTriangle, X, Calendar, ChevronDown } from "lucide-react";

export const CustomDateDropdown = ({
    availableDates,
    selectedDate,
    onDateChange,
    isMobile,
    maxHeight = "120px"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return "Select Date";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0px",
                    padding: isMobile ? "1px 5px" : "2px 6px",
                    fontSize: isMobile ? "8px" : "9px",
                    borderRadius: "3px",
                    border: "1px solid #d1d5db",
                    background: "white",
                    color: "#1f2937",
                    cursor: "pointer",
                    height: isMobile ? "18px" : "20px",
                    minWidth: isMobile ? "76px" : "96px",
                    justifyContent: "space-between",
                }}
            >
                <span style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginRight: "2px",
                }}>
                    {selectedDate ? formatDateDisplay(selectedDate) : "Select Date"}
                </span>
                <ChevronDown
                    size={10}
                    color="#6b7280"
                    style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        flexShrink: 0,
                        marginLeft: "-1px",
                    }}
                />
            </div>

            {isOpen && (
                <div style={{
                    position: "absolute",
                    top: "calc(100% + 2px)",
                    left: 0,
                    right: 0,
                    background: "white",
                    borderRadius: "5px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    border: "1px solid #e5e7eb",
                    maxHeight: isMobile ? "120px" : maxHeight,
                    overflowY: "auto",
                    zIndex: 1000,
                    minWidth: "104px",
                }}>
                    {availableDates.map((date) => (
                        <div
                            key={date}
                            onClick={() => {
                                onDateChange(date);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: isMobile ? "4px 8px" : "5px 10px",
                                fontSize: isMobile ? "8px" : "9px",
                                cursor: "pointer",
                                background: selectedDate === date ? "#eff6ff" : "white",
                                color: selectedDate === date ? "#1d4ed8" : "#1f2937",
                                fontWeight: selectedDate === date ? "600" : "400",
                                transition: "background 0.1s",
                                borderBottom: "1px solid #f3f4f6",
                            }}
                            onMouseEnter={(e) => {
                                if (selectedDate !== date) e.target.style.background = "#f9fafb";
                            }}
                            onMouseLeave={(e) => {
                                if (selectedDate !== date) e.target.style.background = "white";
                            }}
                        >
                            {formatDateDisplay(date)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Custom tooltip for chart
