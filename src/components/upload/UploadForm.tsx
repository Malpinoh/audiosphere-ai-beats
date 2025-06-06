
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "./FileUploader";
import { TagInput } from "./TagInput";
import { MoodSelector } from "./MoodSelector";
import { toast } from "sonner";
import { Loader2, Upload, Music, Album, Disc3 } from "lucide-react";

const trackTypes = [
  { value: "single", label: "Single Track", icon: Music },
  { value: "ep", label: "EP (3-6 tracks)", icon: Disc3 },
  { value: "album", label: "Album (7+ tracks)", icon: Album }
];

const genres = [
  "Pop", "Rock", "Hip Hop", "R&B", "Country", "Jazz", "Classical", 
  "Electronic", "Folk", "Blues", "Reggae", "Punk", "Metal", "Indie", 
  "Alternative", "Funk", "Soul", "Gospel", "World", "Latin", "Other"
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  trackType: z.enum(["single", "ep", "album"]),
  albumName: z.string().optional(),
  trackNumber: z.number().min(1).optional(),
  totalTracks: z.number().min(1).optional(),
  genre: z.string().min(1, "Genre is required"),
  mood: z.string().min(1, "Mood is required"),
  description: z.string().optional(),
  lyrics: z.string().optional(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  useAiAnalysis: z.boolean().default(false),
  overrideGenre: z.boolean().default(false),
  overrideMood: z.boolean().default(false),
  overrideTags: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export function UploadForm() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      artist: "",
      trackType: "single",
      albumName: "",
      genre: "",
      mood: "",
      description: "",
      lyrics: "",
      tags: [],
      published: false,
      useAiAnalysis: false,
      overrideGenre: false,
      overrideMood: false,
      overrideTags: false,
    },
  });

  const watchTrackType = form.watch("trackType");
  const watchUseAiAnalysis = form.watch("useAiAnalysis");

  const handleSubmit = async (data: FormData) => {
    if (!audioFile || !coverArt) {
      toast.error("Please upload both audio file and cover art");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get API key from local storage (in a real app, this would be securely stored)
      const apiKey = localStorage.getItem('upload_api_key');
      if (!apiKey) {
        toast.error("No API key found. Please contact admin.");
        return;
      }

      const formData = new FormData();
      
      // Add all form fields
      formData.append('title', data.title);
      formData.append('artist', data.artist);
      formData.append('track_type', data.trackType);
      
      if (data.albumName && data.trackType !== 'single') {
        formData.append('album_name', data.albumName);
      }
      
      if (data.trackNumber && data.trackType !== 'single') {
        formData.append('track_number', data.trackNumber.toString());
      }
      
      if (data.totalTracks && data.trackType !== 'single') {
        formData.append('total_tracks', data.totalTracks.toString());
      }
      
      formData.append('genre', data.genre);
      formData.append('mood', data.mood);
      
      if (data.description) {
        formData.append('description', data.description);
      }
      
      if (data.lyrics) {
        formData.append('lyrics', data.lyrics);
      }
      
      formData.append('tags', JSON.stringify(data.tags));
      formData.append('published', data.published.toString());
      formData.append('use_ai_analysis', data.useAiAnalysis.toString());
      formData.append('override_genre', data.overrideGenre.toString());
      formData.append('override_mood', data.overrideMood.toString());
      formData.append('override_tags', data.overrideTags.toString());
      
      // Add files
      formData.append('audio_file', audioFile);
      formData.append('cover_art', coverArt);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('https://qkpjlfcpncvvjyzfolag.supabase.co/functions/v1/music-upload', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${data.trackType === 'single' ? 'Track' : data.trackType.toUpperCase()} uploaded successfully!`);
        
        // Reset form
        form.reset();
        setAudioFile(null);
        setCoverArt(null);
        setUploadProgress(0);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Track Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Track Type</CardTitle>
            <CardDescription className="text-white/60">
              Choose what type of music you're uploading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="trackType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {trackTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <div
                            key={type.value}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              field.value === type.value
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-white/20 hover:border-white/40"
                            }`}
                            onClick={() => field.onChange(type.value)}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="h-6 w-6 text-purple-400" />
                              <span className="text-white font-medium">{type.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      {watchTrackType === 'single' ? 'Track Title' : 
                       watchTrackType === 'ep' ? 'EP Title' : 'Album Title'}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-black/40 border-white/20 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="artist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Artist Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-black/40 border-white/20 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Album-specific fields */}
            {watchTrackType !== 'single' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="albumName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Album/EP Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-black/40 border-white/20 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Track Number</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          className="bg-black/40 border-white/20 text-white" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalTracks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Total Tracks</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          className="bg-black/40 border-white/20 text-white" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Genre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/40 border-white/20 text-white">
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Mood</FormLabel>
                    <FormControl>
                      <MoodSelector value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">File Uploads</CardTitle>
            <CardDescription className="text-white/60">
              Upload your audio file (up to 100MB) and cover art
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Audio File</label>
                <FileUploader
                  accept="audio/*"
                  maxSize={100}
                  onFileSelected={setAudioFile}
                  selectedFile={audioFile}
                  fileType="audio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Cover Art</label>
                <FileUploader
                  accept="image/*"
                  maxSize={10}
                  onFileSelected={setCoverArt}
                  selectedFile={coverArt}
                  fileType="image"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      className="bg-black/40 border-white/20 text-white min-h-[100px]"
                      placeholder="Tell us about this track..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lyrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Lyrics (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      className="bg-black/40 border-white/20 text-white min-h-[150px]"
                      placeholder="Enter song lyrics here..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      tags={field.value}
                      setTags={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">AI Analysis (Optional)</CardTitle>
            <CardDescription className="text-white/60">
              Use AI to automatically analyze your music and suggest metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="useAiAnalysis"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-white">Enable AI Analysis</FormLabel>
                    <div className="text-sm text-white/60">
                      Automatically analyze audio content and suggest genre, mood, and tags
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchUseAiAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="overrideGenre"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm text-white">Override Genre</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overrideMood"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm text-white">Override Mood</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overrideTags"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm text-white">Override Tags</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="text-white">Publish immediately</FormLabel>
                      <div className="text-sm text-white/60">
                        Make this {watchTrackType} available to the public
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isUploading || !audioFile || !coverArt}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {watchTrackType === 'single' ? 'Track' : watchTrackType.toUpperCase()}
                  </>
                )}
              </Button>
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
