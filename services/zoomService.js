const axios = require('axios');

/**
 * Zoom API Service for creating meeting links
 * 
 * Note: For production, you need to:
 * 1. Create a Zoom App at https://marketplace.zoom.us/
 * 2. Get API Key and Secret (or use OAuth)
 * 3. Store credentials in environment variables
 */

class ZoomService {
    constructor() {
        // Zoom API credentials from environment variables
        this.apiKey = process.env.ZOOM_API_KEY;
        this.apiSecret = process.env.ZOOM_API_SECRET;
        this.accountId = process.env.ZOOM_ACCOUNT_ID;
        this.baseURL = 'https://api.zoom.us/v2';
    }

    /**
     * Get OAuth access token for Zoom API
     */
    async getAccessToken() {
        try {
            const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
            
            const response = await axios.post(
                'https://zoom.us/oauth/token',
                null,
                {
                    params: {
                        grant_type: 'account_credentials',
                        account_id: this.accountId
                    },
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            return response.data.access_token;
        } catch (error) {
            console.error('Error getting Zoom access token:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Zoom API');
        }
    }

    /**
     * Create a new Zoom meeting
     * @param {Object} meetingDetails - Meeting configuration
     * @param {string} meetingDetails.topic - Meeting title
     * @param {string} meetingDetails.start_time - ISO 8601 start time
     * @param {number} meetingDetails.duration - Duration in minutes
     * @param {string} meetingDetails.password - Meeting password (optional)
     */
    async createMeeting(meetingDetails) {
        try {
            // If Zoom credentials are not configured, use mock meeting link
            if (!this.apiKey || !this.apiSecret) {
                console.log('Zoom credentials not configured, using mock meeting link');
                return this.generateMockMeeting(meetingDetails);
            }

            const accessToken = await this.getAccessToken();

            const payload = {
                topic: meetingDetails.topic || 'Live Class Session',
                type: 2, // Scheduled meeting
                start_time: meetingDetails.start_time || new Date().toISOString(),
                duration: meetingDetails.duration || 60,
                timezone: 'Asia/Kolkata',
                password: meetingDetails.password || Math.random().toString(36).substring(2, 8),
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: true,
                    waiting_room: false,
                    auto_recording: 'cloud',
                    enforce_login: false,
                    allow_multiple_devices: true,
                    jbh_time: 0,
                    registration_type: 1,
                    audio: 'both',
                    meeting_authentication: false
                }
            };

            const response = await axios.post(
                `${this.baseURL}/users/me/meetings`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                meetingId: response.data.id,
                meetingNumber: response.data.id,
                joinUrl: response.data.join_url,
                startUrl: response.data.start_url,
                password: response.data.password,
                hostEmail: response.data.host_email,
                createdAt: response.data.created_at,
                duration: response.data.duration,
                startTime: response.data.start_time,
                topic: response.data.topic,
                isZoomMeeting: true
            };
        } catch (error) {
            console.error('Error creating Zoom meeting:', error.response?.data || error.message);
            // Fallback to mock meeting if Zoom API fails
            return this.generateMockMeeting(meetingDetails);
        }
    }

    /**
     * Generate a mock meeting link for testing or when Zoom API is not available
     */
    generateMockMeeting(meetingDetails) {
        const roomId = `smart-school-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const password = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        return {
            success: true,
            meetingId: roomId,
            meetingNumber: roomId,
            joinUrl: `https://meet.jit.si/${roomId}`, // Using Jitsi as free alternative
            startUrl: `https://meet.jit.si/${roomId}#config.prejoinPageEnabled=false`,
            password: password,
            hostEmail: null,
            createdAt: new Date().toISOString(),
            duration: meetingDetails.duration || 60,
            startTime: meetingDetails.start_time || new Date().toISOString(),
            topic: meetingDetails.topic || 'Live Class Session',
            isZoomMeeting: false,
            isMockMeeting: true
        };
    }

    /**
     * Delete a Zoom meeting
     */
    async deleteMeeting(meetingId) {
        try {
            if (!this.apiKey || !this.apiSecret) {
                return { success: true, message: 'Mock meeting deleted' };
            }

            const accessToken = await this.getAccessToken();

            await axios.delete(
                `${this.baseURL}/meetings/${meetingId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            return { success: true, message: 'Meeting deleted successfully' };
        } catch (error) {
            console.error('Error deleting Zoom meeting:', error.response?.data || error.message);
            throw new Error('Failed to delete Zoom meeting');
        }
    }

    /**
     * Get meeting details
     */
    async getMeeting(meetingId) {
        try {
            if (!this.apiKey || !this.apiSecret) {
                return {
                    success: true,
                    id: meetingId,
                    status: 'active',
                    isMockMeeting: true
                };
            }

            const accessToken = await this.getAccessToken();

            const response = await axios.get(
                `${this.baseURL}/meetings/${meetingId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            return {
                success: true,
                ...response.data,
                isMockMeeting: false
            };
        } catch (error) {
            console.error('Error getting Zoom meeting:', error.response?.data || error.message);
            throw new Error('Failed to get meeting details');
        }
    }
}

module.exports = new ZoomService();
