/**
 * Timezone utility functions for converting and displaying dates/times
 * in the student's local timezone
 */

class TimezoneUtils {
    /**
     * Get the student's timezone from their profile or fallback to browser timezone
     * @param {Object} user - User object with timezone field
     * @returns {string} Timezone string (e.g., 'America/Chicago', 'Asia/Kolkata')
     */
    static getStudentTimezone(user) {
        console.log('getStudentTimezone called with user:', user);
        
        // First try to get timezone from user profile
        if (user && user.timezone && user.timezone.trim() !== '') {
            console.log('Using user timezone:', user.timezone);
            return user.timezone;
        }
        
        // Fallback to browser timezone detection
        try {
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log('Using browser timezone:', browserTimezone);
            return browserTimezone;
        } catch (error) {
            console.warn('Could not detect browser timezone, using default');
            return 'Asia/Kolkata';
        }
    }

    /**
     * Format a date string in the specified timezone
     * @param {string|Date} dateInput - Date to format
     * @param {string} timezone - Target timezone
     * @param {string} format - Output format (default: 'DD-MM-YYYY/dddd')
     * @returns {string} Formatted date string
     */
    static formatDateInTimezone(dateInput, timezone, format = 'DD-MM-YYYY/dddd') {
        if (!dateInput) return 'Date not specified';
        
        try {
            let date;
            // Handle different date input types
            if (typeof dateInput === 'string') {
                // If already formatted with day names, return as is
                if (dateInput.includes('/')) {
                    console.log('Date already formatted, returning as is:', dateInput);
                    return dateInput;
                }
                
                // Parse DD-MM-YYYY format
                if (dateInput.match(/^\d{2}-\d{2}-\d{4}$/)) {
                    const [day, month, year] = dateInput.split('-');
                    date = new Date(`${year}-${month}-${day}`);
                } else {
                    date = new Date(dateInput);
                }
            } else {
                date = new Date(dateInput);
            }
            
            // Validate date
            if (isNaN(date.getTime())) {
                console.error('Invalid date detected:', dateInput);
                return 'Invalid Date';
            }
            
            // Use Intl.DateTimeFormat for timezone-aware formatting
            const formatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: timezone,
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                weekday: 'long'
            });
            
            const parts = formatter.formatToParts(date);
            const day = parts.find(p => p.type === 'day')?.value || '01';
            const month = parts.find(p => p.type === 'month')?.value || '01';
            const year = parts.find(p => p.type === 'year')?.value || '2024';
            const weekday = parts.find(p => p.type === 'weekday')?.value || 'Monday';
            
            return `${day}-${month}-${year}/${weekday}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            // Fallback to simple formatting
            try {
                return new Date(dateInput).toLocaleDateString();
            } catch (fallbackError) {
                return 'Date formatting error';
            }
        }
    }

    /**
     * Format a time string in the specified timezone
     * @param {string|Date} timeInput - Time to format (can be date with time)
     * @param {string} timezone - Target timezone
     * @param {string} format - Output format (default: 'HH:mm')
     * @returns {string} Formatted time string
     */
    static formatTimeInTimezone(timeInput, timezone, format = 'HH:mm') {
        if (!timeInput) return 'Time not specified';
        
        try {
            let date;
            // Handle different time input types
            if (typeof timeInput === 'string') {
                // If already in HH:mm format, return as is
                if (timeInput.match(/^\d{2}:\d{2}$/)) {
                    console.log('Time already formatted, returning as is:', timeInput);
                    return timeInput;
                }
                
                // Create date from time string
                date = new Date(timeInput);
            } else {
                date = new Date(timeInput);
            }
            
            // Validate date
            if (isNaN(date.getTime())) {
                console.error('Invalid time detected:', timeInput);
                return 'Invalid Time';
            }
            
            // Use Intl.DateTimeFormat for timezone-aware formatting
            const formatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            const parts = formatter.formatToParts(date);
            const hour = parts.find(p => p.type === 'hour')?.value || '00';
            const minute = parts.find(p => p.type === 'minute')?.value || '00';
            
            return `${hour}:${minute}`;
        } catch (error) {
            console.error('Error formatting time:', error);
            // Fallback to simple formatting
            try {
                return new Date(timeInput).toLocaleTimeString('en-GB', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (fallbackError) {
                return 'Time formatting error';
            }
        }
    }

    /**
     * Convert time from one timezone to another
     * @param {string|Date} timeInput - Time to convert
     * @param {string} fromTimezone - Source timezone
     * @param {string} toTimezone - Target timezone
     * @returns {Date} Date object in target timezone
     */
    static convertTimezone(timeInput, fromTimezone, toTimezone) {
        if (!timeInput) return null;
        
        try {
            // Create date string in source timezone
            const date = new Date(timeInput);
            
            // Format the date in target timezone
            const targetFormatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: toTimezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const parts = targetFormatter.formatToParts(date);
            const year = parseInt(parts.find(p => p.type === 'year')?.value || '2024');
            const month = parseInt(parts.find(p => p.type === 'month')?.value || '01') - 1; // JS months are 0-indexed
            const day = parseInt(parts.find(p => p.type === 'day')?.value || '01');
            const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '00');
            const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '00');
            const second = parseInt(parts.find(p => p.type === 'second')?.value || '00');
            
            return new Date(year, month, day, hour, minute, second);
        } catch (error) {
            console.error('Error converting timezone:', error);
            return new Date(timeInput);
        }
    }

    /**
     * Get timezone abbreviation (e.g., IST, EST, PST)
     * @param {string} timezone - Timezone string
     * @returns {string} Timezone abbreviation
     */
    static getTimezoneAbbreviation(timezone) {
        try {
            const date = new Date();
            const formatter = new Intl.DateTimeFormat('en', {
                timeZone: timezone,
                timeZoneName: 'short'
            });
            
            const parts = formatter.formatToParts(date);
            const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value;
            return timeZoneName || timezone;
        } catch (error) {
            return timezone;
        }
    }

    /**
     * Display timezone information to the user
     * @param {string} timezone - Current timezone
     * @returns {string} User-friendly timezone display
     */
    static getDisplayTimezone(timezone) {
        const abbreviation = this.getTimezoneAbbreviation(timezone);
        return `${timezone} (${abbreviation})`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimezoneUtils;
} else {
    window.TimezoneUtils = TimezoneUtils;
}
