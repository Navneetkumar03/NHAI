import React, { useState, useEffect, useMemo, useRef } from "react";
import { Activity, ArrowUp, ArrowDown, AlertTriangle, X, Calendar, ChevronDown } from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine, ReferenceArea, ComposedChart
} from 'recharts';
import { useTrafficData } from "../../hooks/useTrafficData";



/* ============================================================
   Inlined CustomDateDropdown 
   ============================================================ */
const CustomDateDropdown = ({
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

/* ============================================================
   Inlined CustomTooltip 
   ============================================================ */
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'white',
                padding: '6px 8px',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb',
                fontSize: '10px'
            }}>
                <p style={{ fontWeight: '600', color: '#374151', marginBottom: '3px' }}>
                    {label}
                </p>
                {payload.map((entry, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        color: entry.color
                    }}>
                        <span>{entry.name}:</span>
                        <span style={{ fontWeight: '600' }}>
                            {entry.value.toFixed(2)}
                            {entry.value > 1 && ' 🔴'}
                        </span>
                    </div>
                ))}
                <div style={{ fontSize: '8px', color: '#9ca3af', marginTop: '3px', borderTop: '1px solid #e5e7eb', paddingTop: '3px' }}>
                    Ratio &gt; 1 = Traffic
                </div>
            </div>
        );
    }
    return null;
};

/* ============================================================
   Main Panel
   ============================================================ */
export function TrafficAnalysisPanel({
    selectedFlyoverForTraffic,
    displayName,
    onClose,
    isMobile
}) {
    const [selectedDate, setSelectedDate] = useState(null);

    const { trafficData, loading: trafficLoading, error: trafficError, availableDates } = useTrafficData(
        selectedFlyoverForTraffic,
        selectedDate
    );

    useEffect(() => {
        if (trafficData?.selected_date && trafficData.selected_date !== "last_24h") {
            setSelectedDate(trafficData.selected_date);
        } else if (trafficData?.available_dates && trafficData.available_dates.length > 0) {
            setSelectedDate(trafficData.available_dates[0]);
        }
    }, [trafficData]);

    useEffect(() => {
        setSelectedDate(null);
    }, [selectedFlyoverForTraffic]);

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return "Select Date";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDisplayDate = () => {
        if (selectedDate) return selectedDate;
        if (trafficData?.selected_date && trafficData.selected_date !== "last_24h") {
            return trafficData.selected_date;
        }
        return null;
    };

    const fullChartData = useMemo(() => {
        if (!trafficData?.traffic_data) return [];
        const upData = trafficData.traffic_data.up || [];
        const downData = trafficData.traffic_data.down || [];
        const map = new Map();

        const upsert = (item, valKey, hasKey) => {
            const existing = map.get(item.time) || {
                time: item.time, up_ratio: null, up_has_traffic: null,
                down_ratio: null, down_has_traffic: null,
            };
            existing[valKey] = item.traffic_ratio;
            existing[hasKey] = item.has_traffic;
            map.set(item.time, existing);
        };

        upData.forEach(i => upsert(i, 'up_ratio', 'up_has_traffic'));
        downData.forEach(i => upsert(i, 'down_ratio', 'down_has_traffic'));

        return Array.from(map.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
    }, [trafficData]);

    const getDateIntervals = () => {
        const intervals = [];
        for (let i = 0; i < 6; i++) {
            const startHour = i * 4;
            const endHour = startHour + 4;
            const label = endHour === 24 ? `${startHour}:00–24:00` : `${startHour}:00–${endHour}:00`;
            intervals.push({
                key: `block-${i}`,
                label,
                startHour,
                endHour,
                isCurrent: false
            });
        }
        return intervals;
    };

    const [dynamicIntervals, setDynamicIntervals] = useState(getDateIntervals);
    const [selectedInterval, setSelectedInterval] = useState('block-0');
    const [zoomDomain, setZoomDomain] = useState(null);
    const [refAreaLeft, setRefAreaLeft] = useState('');
    const [refAreaRight, setRefAreaRight] = useState('');

    const intervalFilteredData = useMemo(() => {
        if (!fullChartData || fullChartData.length === 0) return [];

        const interval = dynamicIntervals.find(i => i.key === selectedInterval);
        if (!interval) return fullChartData;

        return fullChartData.filter(d => {
            const date = new Date(d.time);
            const hours = date.getHours();
            if (interval.startHour >= interval.endHour) {
                return hours >= interval.startHour || hours < interval.endHour;
            }
            return hours >= interval.startHour && hours < interval.endHour;
        });
    }, [fullChartData, selectedInterval, dynamicIntervals]);

    function downsample(data, maxPoints = 300) {
        if (data.length <= maxPoints) return data;
        const bucketSize = Math.ceil(data.length / maxPoints);
        const result = [];
        for (let i = 0; i < data.length; i += bucketSize) {
            const bucket = data.slice(i, i + bucketSize);
            const maxUp = bucket.reduce((m, d) => (d.up_ratio ?? 0) > (m.up_ratio ?? 0) ? d : m, bucket[0]);
            const maxDown = bucket.reduce((m, d) => (d.down_ratio ?? 0) > (m.down_ratio ?? 0) ? d : m, bucket[0]);
            result.push({
                time: bucket[Math.floor(bucket.length / 2)].time,
                up_ratio: maxUp.up_ratio,
                up_has_traffic: bucket.some(d => d.up_has_traffic),
                down_ratio: maxDown.down_ratio,
                down_has_traffic: bucket.some(d => d.down_has_traffic),
            });
        }
        return result;
    }

    const displayedChartData = useMemo(() => {
        let data = intervalFilteredData;
        if (zoomDomain) {
            data = data.filter(d => {
                const t = new Date(d.time).getTime();
                return t >= zoomDomain.start && t <= zoomDomain.end;
            });
        }
        return data.length > 300 ? downsample(data, 300) : data;
    }, [intervalFilteredData, zoomDomain]);

    const handleMouseDown = (e) => e?.activeLabel && setRefAreaLeft(e.activeLabel);
    const handleMouseMove = (e) => refAreaLeft && e?.activeLabel && setRefAreaRight(e.activeLabel);
    const handleMouseUp = () => {
        if (refAreaLeft && refAreaRight) {
            let start = new Date(refAreaLeft).getTime();
            let end = new Date(refAreaRight).getTime();
            if (start > end) [start, end] = [end, start];
            if (end - start > 1000) setZoomDomain({ start, end });
        }
        setRefAreaLeft('');
        setRefAreaRight('');
    };
    const resetZoom = () => setZoomDomain(null);

    useEffect(() => {
        setZoomDomain(null);
        setSelectedInterval('block-0');
        setDynamicIntervals(getDateIntervals());
    }, [selectedFlyoverForTraffic, selectedDate, trafficData]);

    const displayDate = getDisplayDate();

    // ---------- COMPACT SIZE TOKENS ----------
    const padX = isMobile ? 8 : 10;
    const padY = isMobile ? 6 : 8;
    const headerPadY = isMobile ? 6 : 8;
    const gap = isMobile ? 4 : 6;
    const chartH = isMobile ? 90 : 110;
    const titleSize = isMobile ? 11 : 12;
    const subSize = isMobile ? 8 : 9;
    const sectionTitle = isMobile ? 10 : 11;
    const cardTitleSize = isMobile ? 9 : 10;
    const cardLabelSize = isMobile ? 7 : 8;
    const cardValueSize = isMobile ? 10 : 11;

    const panelWidth = isMobile ? "100%" : "340px";
    const panelMaxHeight = isMobile ? "380px" : "calc(100% - 24px)";
    // ------------------------------------------

    return (
        <div style={{
            width: panelWidth,
            maxWidth: panelWidth,
            height: isMobile ? "auto" : "100%",
            maxHeight: panelMaxHeight,
            minWidth: 0,
            background: "white",
            borderRadius: isMobile ? "6px" : "8px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flexShrink: 1,
            transition: "all 0.3s ease",
            position: "relative",
            marginBottom: isMobile ? "8px" : "0",
        }}>
            {/* Panel Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${headerPadY}px ${padX}px`,
                borderBottom: "1px solid #e5e7eb",
                background: "#f8fafc",
                flexShrink: 0,
                flexWrap: "wrap",
                gap: gap,
            }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{
                        fontSize: titleSize,
                        fontWeight: "bold",
                        color: "#1f2937",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        margin: 0,
                    }}>
                        {displayName || selectedFlyoverForTraffic}
                    </h3>
                    <p style={{
                        fontSize: subSize,
                        color: "#6b7280",
                        margin: 0,
                    }}>
                        Traffic Analysis {displayDate ? ` ${formatDateDisplay(displayDate)}` : "Loading..."}
                    </p>
                </div>

                {availableDates && availableDates.length > 0 && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        flexShrink: 0,
                    }}>
                        <Calendar size={isMobile ? 11 : 12} color="#6b7280" />
                        <CustomDateDropdown
                            availableDates={availableDates}
                            selectedDate={selectedDate || displayDate}
                            onDateChange={setSelectedDate}
                            isMobile={isMobile}
                            maxHeight="120px"
                        />
                    </div>
                )}

                <button
                    onClick={onClose}
                    style={{
                        width: isMobile ? "20px" : "22px",
                        height: isMobile ? "20px" : "22px",
                        borderRadius: "5px",
                        border: "1px solid #e5e7eb",
                        background: "#f8fafc",
                        cursor: "pointer",
                        color: "#6b7280",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        flexShrink: 0,
                        padding: 0,
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "#fef2f2";
                        e.target.style.borderColor = "#fca5a5";
                        e.target.style.color = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "#f8fafc";
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.color = "#6b7280";
                    }}
                >
                    <X size={isMobile ? 12 : 13} strokeWidth={2} />
                </button>
            </div>

            {/* Panel Content */}
            <div style={{
                flex: 1,
                overflowY: "auto",
                padding: `${padY}px ${padX}px`,
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
                minHeight: 0,
            }}>
                {trafficLoading ? (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        minHeight: "120px",
                        gap: "8px",
                    }}>
                        <div style={{
                            width: "22px",
                            height: "22px",
                            border: "3px solid #e5e7eb",
                            borderTop: "3px solid #3b82f6",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }} />
                        <p style={{ fontSize: isMobile ? "10px" : "11px", color: "#6b7280", margin: 0 }}>
                            Loading traffic data...
                        </p>
                    </div>
                ) : trafficError ? (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        minHeight: "120px",
                        gap: "6px",
                    }}>
                        <AlertTriangle size={isMobile ? 20 : 22} color="#ef4444" />
                        <p style={{ fontSize: isMobile ? "10px" : "11px", color: "#ef4444", fontWeight: "500", margin: 0 }}>
                            Failed to load traffic data
                        </p>
                        <p style={{ fontSize: isMobile ? "8px" : "9px", color: "#6b7280", margin: 0 }}>{trafficError}</p>
                    </div>
                ) : !trafficData ? (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        minHeight: "120px",
                        gap: "6px",
                    }}>
                        <Activity size={isMobile ? 20 : 22} color="#d1d5db" />
                        <p style={{ fontSize: isMobile ? "10px" : "11px", color: "#6b7280", fontWeight: "500", margin: 0 }}>
                            No traffic data available
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: "4px" }}>
                            <div style={{
                                fontSize: sectionTitle,
                                fontWeight: "600",
                                color: "#1f2937",
                                marginBottom: "4px",
                            }}>
                                Traffic Summary
                            </div>
                        </div>

                        {fullChartData.length > 0 && (
                            <div style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                padding: isMobile ? "6px" : "8px",
                                marginBottom: "8px",
                                background: "#fafafa"
                            }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "4px",
                                    flexWrap: "wrap",
                                    gap: "4px",
                                }}>
                                    <span style={{
                                        fontSize: isMobile ? "9px" : "10px",
                                        fontWeight: "600",
                                        color: "#374151"
                                    }}>
                                        Traffic Chart
                                        {zoomDomain ? " (Zoomed)" : ` (${dynamicIntervals.find(i => i.key === selectedInterval)?.label || 'Selected Range'})`}
                                    </span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: isMobile ? "2px" : "4px",
                                    marginBottom: "6px",
                                    flexWrap: 'wrap'
                                }}>
                                    {dynamicIntervals.map(interval => (
                                        <button
                                            key={interval.key}
                                            onClick={() => { setSelectedInterval(interval.key); setZoomDomain(null); }}
                                            style={{
                                                fontSize: isMobile ? "6px" : "8px",
                                                padding: isMobile ? "1px 4px" : "2px 6px",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                border: selectedInterval === interval.key ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                                                background: selectedInterval === interval.key ? '#eff6ff' : 'white',
                                                color: selectedInterval === interval.key ? '#1d4ed8' : '#6b7280',
                                                fontWeight: selectedInterval === interval.key ? '600' : '500',
                                                position: 'relative',
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {interval.label}
                                        </button>
                                    ))}
                                    {zoomDomain && (
                                        <button onClick={resetZoom} style={{
                                            fontSize: isMobile ? "6px" : "8px",
                                            padding: isMobile ? "1px 4px" : "2px 6px",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            border: '1px solid #ef4444',
                                            background: '#fef2f2',
                                            color: '#dc2626',
                                            fontWeight: '600',
                                            whiteSpace: "nowrap",
                                        }}>
                                            Reset
                                        </button>
                                    )}
                                </div>

                                <div style={{ height: `${chartH}px`, width: "100%" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart
                                            data={displayedChartData}
                                            margin={{ top: 4, right: 4, left: -26, bottom: 0 }}
                                            onMouseDown={handleMouseDown}
                                            onMouseMove={handleMouseMove}
                                            onMouseUp={handleMouseUp}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="time"
                                                tick={{ fontSize: isMobile ? 5 : 7, fill: '#181b21' }}
                                                tickFormatter={(value) => {
                                                    const date = new Date(value);
                                                    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                                                }}
                                                interval="preserveStart"
                                            />
                                            <YAxis
                                                tick={{ fontSize: isMobile ? 5 : 7, fill: '#181b21' }}
                                                domain={[0.5, 1.5]}
                                                ticks={[0.5, 0.75, 1.0, 1.25, 1.5]}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: isMobile ? '7px' : '8px' }} />
                                            <ReferenceLine y={1} stroke="#9ca3af" strokeDasharray="3 3" />
                                            <Line
                                                type="monotone"
                                                dataKey="up_ratio"
                                                stroke="#3b82f6"
                                                strokeWidth={1.5}
                                                dot={(props) => {
                                                    const { cx, cy, payload } = props;
                                                    if (payload?.up_has_traffic) {
                                                        return <circle cx={cx} cy={cy} r={isMobile ? 2.5 : 3} fill="#ef4444" stroke="#fff" strokeWidth={1} />;
                                                    }
                                                    return <circle cx={cx} cy={cy} r={1.5} fill="#3b82f6" />;
                                                }}
                                                name="Up"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="down_ratio"
                                                stroke="#ef4444"
                                                strokeWidth={1.5}
                                                dot={(props) => {
                                                    const { cx, cy, payload } = props;
                                                    if (payload?.down_has_traffic) {
                                                        return <circle cx={cx} cy={cy} r={isMobile ? 2.5 : 3} fill="#ef4444" stroke="#fff" strokeWidth={1} />;
                                                    }
                                                    return <circle cx={cx} cy={cy} r={1.5} fill="#ef4444" />;
                                                }}
                                                name="Down"
                                            />
                                            {refAreaLeft && refAreaRight && (
                                                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#3b82f6" fillOpacity={0.15} />
                                            )}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>

                                <div style={{
                                    fontSize: isMobile ? "7px" : "8px",
                                    color: "#181b21",
                                    textAlign: "center",
                                    marginTop: "3px"
                                }}>
                                    {zoomDomain
                                        ? "Drag again to zoom • Click Reset to go back"
                                        : "Drag on chart to zoom in • Red = Traffic detected | Line at 1.0 = Normal"}
                                </div>
                            </div>
                        )}

                        {trafficData?.direction_data && (
                            <>
                                {/* Up Direction */}
                                <div style={{
                                    border: "1px solid #bfdbfe",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    marginBottom: "6px",
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: isMobile ? "4px 8px" : "5px 10px",
                                        background: "#eff6ff",
                                        flexWrap: "wrap",
                                        gap: "4px",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <ArrowUp size={isMobile ? 10 : 11} color="#2563eb" />
                                            <span style={{
                                                fontSize: cardTitleSize,
                                                fontWeight: "600",
                                                color: "#1d4ed8"
                                            }}>
                                                Up Direction
                                            </span>
                                        </div>
                                        <span style={{
                                            fontSize: cardLabelSize + 1,
                                            fontWeight: "500",
                                            padding: "1px 6px",
                                            borderRadius: "999px",
                                            background: trafficData?.direction_data?.up?.avg_traffic_ratio > 1 ? "#fee2e2" : "#dcfce7",
                                            color: trafficData?.direction_data?.up?.avg_traffic_ratio > 1 ? "#dc2626" : "#16a34a",
                                        }}>
                                            {trafficData?.direction_data?.up?.avg_traffic_ratio > 1 ? '🔴 Traffic' : '✅ Clear'}
                                        </span>
                                    </div>
                                    <div style={{
                                        padding: isMobile ? "5px 8px" : "6px 10px",
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "3px"
                                    }}>
                                        <div>
                                            <p style={{ fontSize: cardLabelSize, color: "#6b7280", margin: 0 }}>Avg Duration</p>
                                            <p style={{ fontSize: cardValueSize, fontWeight: "600", color: "#1f2937", margin: 0 }}>
                                                {trafficData?.direction_data?.up?.avg_duration || 0}s
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: cardLabelSize, color: "#6b7280", margin: 0 }}>Static Duration</p>
                                            <p style={{ fontSize: cardValueSize, fontWeight: "600", color: "#1f2937", margin: 0 }}>
                                                {trafficData?.direction_data?.up?.static_duration || 0}s
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: cardLabelSize, color: "#6b7280", margin: 0 }}>Traffic Ratio</p>
                                            <p style={{
                                                fontSize: cardValueSize,
                                                fontWeight: "600",
                                                margin: 0,
                                                color: trafficData?.direction_data?.up?.avg_traffic_ratio > 1 ? "#dc2626" : "#16a34a"
                                            }}>
                                                {trafficData?.direction_data?.up?.avg_traffic_ratio || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: cardLabelSize, color: "#6b7280", margin: 0 }}>Data Points</p>
                                            <p style={{ fontSize: cardValueSize, fontWeight: "600", color: "#1f2937", margin: 0 }}>
                                                {trafficData?.direction_data?.up?.count || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Down Direction */}
                                <div style={{
                                    border: "1px solid #fca5a5",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: isMobile ? "4px 8px" : "5px 10px",
                                        background: "#fef2f2",
                                        flexWrap: "wrap",
                                        gap: "4px",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <ArrowDown size={isMobile ? 10 : 11} color="#dc2626" />
                                            <span style={{
                                                fontSize: cardTitleSize,
                                                fontWeight: "600",
                                                color: "#b91c1c"
                                            }}>
                                                Down Direction
                                            </span>
                                        </div>
                                        <span style={{
                                            fontSize: cardLabelSize + 1,
                                            fontWeight: "500",
                                            padding: "1px 6px",
                                            borderRadius: "999px",
                                            background: trafficData?.direction_data?.down?.avg_traffic_ratio > 1 ? "#fee2e2" : "#dcfce7",
                                            color: trafficData?.direction_data?.down?.avg_traffic_ratio > 1 ? "#dc2626" : "#16a34a",
                                        }}>
                                            {trafficData?.direction_data?.down?.avg_traffic_ratio > 1 ? '🔴 Traffic' : '✅ Clear'}
                                        </span>
                                    </div>
                                    <div style={{
                                        padding: isMobile ? "5px 8px" : "6px 10px",
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "3px"
                                    }}>
                                        <div>
                                            <p style={{ fontSize: cardLabelSize, color: "#6b7280", margin: 0 }}>Avg Duration</p>
                                            <p style={{ fontSize: cardValueSize, fontWeight: "600", color: "#1f2937", margin: 0 }}>
                                                {trafficData?.direction_data?.down?.avg_duration || 0}s
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: cardLabelSize, color: "#6b7280", margin: 0 }}>Static Duration</p>
                                            <p style={{ fontSize: cardValueSize, fontWeight: "600", color: "#1f2937", margin: 0 }}>
                                                {trafficData?.direction_data?.down?.static_duration || 0}s
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: cardLabelSize, color: "#6b7280", margin: 0 }}>Traffic Ratio</p>
                                            <p style={{
                                                fontSize: cardValueSize,
                                                fontWeight: "600",
                                                margin: 0,
                                                color: trafficData?.direction_data?.down?.avg_traffic_ratio > 1 ? "#dc2626" : "#16a34a"
                                            }}>
                                                {trafficData?.direction_data?.down?.avg_traffic_ratio || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: cardLabelSize, color: "#6b7280", margin: 0 }}>Data Points</p>
                                            <p style={{ fontSize: cardValueSize, fontWeight: "600", color: "#1f2937", margin: 0 }}>
                                                {trafficData?.direction_data?.down?.count || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default TrafficAnalysisPanel;