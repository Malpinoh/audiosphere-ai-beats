import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code } from "lucide-react";

export default function ApiDocumentation() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">MAUDIO API Documentation</h1>
        <p className="text-muted-foreground mb-6">
          Integrate with the MAUDIO platform to upload and manage your music tracks
        </p>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="upload">Upload Music</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>MAUDIO API Overview</CardTitle>
                <CardDescription>
                  The MAUDIO API allows distributors to upload music directly to the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Base URL</h3>
                  <code className="bg-muted p-2 rounded block">
                    https://qkpjlfcpncvvjyzfolag.supabase.co/functions/v1
                  </code>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Available Endpoints</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><code>/music-upload</code> - Upload music files and metadata</li>
                    <li><code>/api-keys</code> - Manage your API keys</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Features</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Secure API key authentication</li>
                    <li>Audio file (MP3, WAV) and cover art upload</li>
                    <li>Complete metadata management</li>
                    <li>AI-powered genre, mood, and tag suggestions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication">
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  The MAUDIO API uses API keys for authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">API Keys</h3>
                  <p>
                    All API requests must include an API key in the header. Your API keys can be managed through the dashboard or using the API Keys endpoint.
                  </p>
                  <div className="bg-muted p-3 rounded mt-2">
                    <p className="text-sm font-medium mb-1">Example API request with key:</p>
                    <code className="text-sm block overflow-x-auto">
                      <pre>{`curl -X POST https://qkpjlfcpncvvjyzfolag.supabase.co/functions/v1/music-upload \\
  -H "Content-Type: multipart/form-data" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "title=My Track" \\
  -F "audio_file=@song.mp3"`}</pre>
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Managing API Keys</h3>
                  <p>
                    To create, list, or delete API keys, use the API Keys endpoint. These operations require authentication using your MAUDIO account credentials.
                  </p>
                  <div className="bg-muted p-3 rounded mt-2">
                    <p className="text-sm font-medium mb-1">Create a new API key:</p>
                    <code className="text-sm block overflow-x-auto">
                      <pre>{`curl -X POST https://qkpjlfcpncvvjyzfolag.supabase.co/functions/v1/api-keys \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \\
  -d '{"name": "Production API Key", "expires_in_days": 365}'`}</pre>
                    </code>
                  </div>
                </div>

                <div className="p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 rounded">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Security Best Practices</h4>
                  <ul className="list-disc pl-6 mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                    <li>Never share your API keys</li>
                    <li>Rotate keys periodically</li>
                    <li>Use separate keys for different environments</li>
                    <li>Set appropriate expiration dates</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Music API</CardTitle>
                <CardDescription>
                  Upload music tracks with metadata to the MAUDIO platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Endpoint</h3>
                  <code className="bg-muted p-2 rounded block">
                    POST /music-upload
                  </code>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Request Format</h3>
                  <p className="mb-2">
                    The request must be a multipart/form-data request containing the following fields:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left border">Field</th>
                          <th className="p-2 text-left border">Type</th>
                          <th className="p-2 text-left border">Required</th>
                          <th className="p-2 text-left border">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border">title</td>
                          <td className="p-2 border">string</td>
                          <td className="p-2 border">Yes</td>
                          <td className="p-2 border">Track title</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">artist</td>
                          <td className="p-2 border">string</td>
                          <td className="p-2 border">Yes</td>
                          <td className="p-2 border">Artist name</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">genre</td>
                          <td className="p-2 border">string</td>
                          <td className="p-2 border">Yes</td>
                          <td className="p-2 border">Music genre</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">mood</td>
                          <td className="p-2 border">string</td>
                          <td className="p-2 border">Yes</td>
                          <td className="p-2 border">Track mood</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">tags</td>
                          <td className="p-2 border">string (JSON array) or comma-separated string</td>
                          <td className="p-2 border">No</td>
                          <td className="p-2 border">Tags for the track</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">audio_file</td>
                          <td className="p-2 border">file (MP3, WAV)</td>
                          <td className="p-2 border">Yes</td>
                          <td className="p-2 border">Audio file (max 30MB)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">cover_art</td>
                          <td className="p-2 border">file (JPG, PNG)</td>
                          <td className="p-2 border">Yes</td>
                          <td className="p-2 border">Cover art image (max 5MB)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">description</td>
                          <td className="p-2 border">string</td>
                          <td className="p-2 border">No</td>
                          <td className="p-2 border">Track description</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">lyrics</td>
                          <td className="p-2 border">string</td>
                          <td className="p-2 border">No</td>
                          <td className="p-2 border">Track lyrics</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">duration</td>
                          <td className="p-2 border">number</td>
                          <td className="p-2 border">No</td>
                          <td className="p-2 border">Track duration in seconds</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">published</td>
                          <td className="p-2 border">boolean</td>
                          <td className="p-2 border">No</td>
                          <td className="p-2 border">Whether to publish immediately (default: false)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">use_ai_analysis</td>
                          <td className="p-2 border">boolean</td>
                          <td className="p-2 border">No</td>
                          <td className="p-2 border">Whether to use AI to analyze the track (default: false)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">override_genre</td>
                          <td className="p-2 border">boolean</td>
                          <td className="p-2 border">No</td>
                          <td className="p-2 border">Whether to override the provided genre with AI suggestion (default: false)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">override_mood</td>
                          <td className="p-2 border">boolean</td>
                          <td className="p-2 border">No</td>
                          <td className="p-2 border">Whether to override the provided mood with AI suggestion (default: false)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">override_tags</td>
                          <td className="p-2 border">boolean</td>
                          <td className="p-2 border">No</td>
                          <td className="p-2 border">Whether to override the provided tags with AI suggestion (default: false)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Response Format</h3>
                  <p className="mb-2">The API returns a JSON response with the following structure:</p>
                  <div className="bg-muted p-3 rounded">
                    <code className="text-sm block overflow-x-auto">
                      <pre>{`{
  "success": true,
  "message": "Track uploaded successfully",
  "data": {
    "track": {
      "id": "uuid",
      "title": "Track Title",
      "artist": "Artist Name",
      "genre": "pop",
      "mood": "energetic",
      "tags": ["pop", "upbeat", "summer"],
      // other track data
    },
    "analyzed_data": {
      "genre": "pop",
      "mood": "energetic",
      "suggestedTags": ["pop", "upbeat", "summer", "fresh", "trending"]
    }
  }
}`}</pre>
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Error Responses</h3>
                  <p className="mb-2">In case of an error, the API returns a JSON response with an error message:</p>
                  <div className="bg-muted p-3 rounded">
                    <code className="text-sm block overflow-x-auto">
                      <pre>{`{
  "success": false,
  "message": "Error message"
}`}</pre>
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples">
            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
                <CardDescription>
                  Example code for integrating with the MAUDIO API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="js">
                  <TabsList className="mb-4">
                    <TabsTrigger value="js">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="js" className="space-y-4">
                    <div>
                      <h3 className="flex items-center text-lg font-medium mb-2">
                        <Code className="mr-2 h-5 w-5" />
                        Uploading a Track with JavaScript
                      </h3>
                      <div className="bg-muted p-3 rounded">
                        <code className="text-sm block overflow-x-auto">
                          <pre>{`async function uploadTrack(apiKey, trackData) {
  const formData = new FormData();
  
  // Add metadata
  formData.append('title', trackData.title);
  formData.append('artist', trackData.artist);
  formData.append('genre', trackData.genre);
  formData.append('mood', trackData.mood);
  
  if (trackData.tags && trackData.tags.length > 0) {
    formData.append('tags', JSON.stringify(trackData.tags));
  }
  
  if (trackData.description) {
    formData.append('description', trackData.description);
  }
  
  if (trackData.lyrics) {
    formData.append('lyrics', trackData.lyrics);
  }
  
  // Add files
  formData.append('audio_file', trackData.audioFile);
  formData.append('cover_art', trackData.coverArt);
  
  // Add AI analysis options
  formData.append('use_ai_analysis', 'true');
  formData.append('override_tags', 'true');
  
  try {
    const response = await fetch(
      'https://qkpjlfcpncvvjyzfolag.supabase.co/functions/v1/music-upload',
      {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
        body: formData,
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error uploading track:', error);
    throw error;
  }
}`}</pre>
                        </code>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="python" className="space-y-4">
                    <div>
                      <h3 className="flex items-center text-lg font-medium mb-2">
                        <Code className="mr-2 h-5 w-5" />
                        Uploading a Track with Python
                      </h3>
                      <div className="bg-muted p-3 rounded">
                        <code className="text-sm block overflow-x-auto">
                          <pre>{`import requests
import json

def upload_track(api_key, track_data):
    url = "https://qkpjlfcpncvvjyzfolag.supabase.co/functions/v1/music-upload"
    
    # Prepare form data
    form_data = {
        'title': track_data['title'],
        'artist': track_data['artist'],
        'genre': track_data['genre'],
        'mood': track_data['mood'],
    }
    
    # Add optional fields
    if 'tags' in track_data:
        form_data['tags'] = json.dumps(track_data['tags'])
    
    if 'description' in track_data:
        form_data['description'] = track_data['description']
    
    if 'lyrics' in track_data:
        form_data['lyrics'] = track_data['lyrics']
    
    # Add AI analysis options
    form_data['use_ai_analysis'] = 'true'
    form_data['override_tags'] = 'true'
    
    # Prepare files
    files = {
        'audio_file': (track_data['audio_filename'], open(track_data['audio_file_path'], 'rb'), 'audio/mpeg'),
        'cover_art': (track_data['cover_art_filename'], open(track_data['cover_art_path'], 'rb'), 'image/jpeg')
    }
    
    # Set headers
    headers = {
        'x-api-key': api_key
    }
    
    try:
        response = requests.post(url, data=form_data, files=files, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error uploading track: {e}")
        if response:
            print(f"Response: {response.text}")
        raise`}</pre>
                        </code>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="curl" className="space-y-4">
                    <div>
                      <h3 className="flex items-center text-lg font-medium mb-2">
                        <Code className="mr-2 h-5 w-5" />
                        Uploading a Track with cURL
                      </h3>
                      <div className="bg-muted p-3 rounded">
                        <code className="text-sm block overflow-x-auto">
                          <pre>{`curl -X POST https://qkpjlfcpncvvjyzfolag.supabase.co/functions/v1/music-upload \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "title=My New Track" \\
  -F "artist=Artist Name" \\
  -F "genre=pop" \\
  -F "mood=energetic" \\
  -F "tags=[\"pop\",\"summer\",\"catchy\"]" \\
  -F "description=This is my awesome new track" \\
  -F "lyrics=These are the lyrics to my song..." \\
  -F "use_ai_analysis=true" \\
  -F "override_tags=true" \\
  -F "audio_file=@/path/to/track.mp3" \\
  -F "cover_art=@/path/to/cover.jpg"`}</pre>
                        </code>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
