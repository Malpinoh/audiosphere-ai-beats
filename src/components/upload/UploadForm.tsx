
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, Music, FileImage, Tag, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "./FileUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoodSelector } from "./MoodSelector";
import { TagInput } from "./TagInput";
import { analyzeMusicContent } from "@/utils/audioAnalysis";

const uploadFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  artist: z.string().min(2, {
    message: "Artist name must be at least 2 characters.",
  }),
  genre: z.string({
    required_error: "Please select a genre.",
  }),
  mood: z.string({
    required_error: "Please select a mood.",
  }),
  tags: z.array(z.string()).min(1, {
    message: "Please add at least 1 tag.",
  }),
  description: z.string().optional(),
  lyrics: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

export function UploadForm() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedTags, setAnalyzedTags] = useState<string[]>([]);
  const [isAutoAnalysisEnabled, setIsAutoAnalysisEnabled] = useState(true);
  const { user, profile } = useAuth();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      artist: "",
      genre: "",
      mood: "",
      tags: [],
      description: "",
      lyrics: "",
    },
  });

  const lyrics = form.watch("lyrics");

  const onAudioFileSelected = async (file: File) => {
    setAudioFile(file);
    
    const fileName = file.name;
    const titleFromFile = fileName.substring(0, fileName.lastIndexOf(".")).replace(/[-_]/g, " ");
    
    if (form.getValues("title") === "" && titleFromFile) {
      form.setValue("title", titleFromFile);
    }
    
    if (isAutoAnalysisEnabled) {
      await analyzeAudioContent();
    }
  };

  const analyzeAudioContent = async () => {
    if (!audioFile) {
      return;
    }
    
    try {
      setIsAnalyzing(true);
      
      const currentLyrics = form.getValues("lyrics") || "";
      const results = await analyzeMusicContent(audioFile, currentLyrics);
      
      if (!form.getValues("genre")) {
        form.setValue("genre", results.genre);
      }
      
      if (!form.getValues("mood")) {
        form.setValue("mood", results.mood);
      }
      
      setAnalyzedTags(results.suggestedTags);
      
      if (form.getValues("tags").length === 0) {
        form.setValue("tags", results.suggestedTags);
      }
      
      toast.success("Track analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze track");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (audioFile && lyrics && lyrics.length > 50 && isAutoAnalysisEnabled) {
      const debounceTimer = setTimeout(() => {
        analyzeAudioContent();
      }, 2000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [lyrics]);

  const onCoverArtSelected = (file: File) => {
    setCoverArt(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCoverArtPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearCoverArt = () => {
    setCoverArt(null);
    setCoverArtPreview(null);
  };

  // Function to generate a random API key if needed
  function generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 32;
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Improved function to get or create an API key
  const getOrCreateApiKey = async (userId: string): Promise<string> => {
    try {
      // First try to get existing API key
      const { data: apiKeys, error: apiKeyError } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('distributor_id', userId)
        .eq('active', true)
        .limit(1);
      
      if (apiKeyError) {
        console.error("Error fetching API key:", apiKeyError);
        throw new Error('Failed to fetch API key');
      }
      
      // If API key exists, return it
      if (apiKeys && apiKeys.length > 0) {
        return apiKeys[0].api_key;
      }
      
      // If no API key found, create one
      const newKey = generateApiKey();
      const { data: newApiKey, error: createKeyError } = await supabase
        .from('api_keys')
        .insert({
          distributor_id: userId,
          name: 'Artist Upload Key',
          api_key: newKey,
          active: true
        })
        .select('api_key')
        .single();
      
      if (createKeyError) {
        console.error("Error creating API key:", createKeyError);
        throw new Error('Failed to create API key: ' + createKeyError.message);
      }
      
      if (!newApiKey) {
        throw new Error('Failed to create API key: No data returned');
      }
      
      return newApiKey.api_key;
    } catch (error) {
      console.error("API key error:", error);
      throw error;
    }
  };

  const onSubmit = async (data: UploadFormValues) => {
    if (!audioFile) {
      toast.error("Please upload an audio file");
      return;
    }

    if (!coverArt) {
      toast.error("Please upload cover art");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to upload tracks");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('cover_art', coverArt);
      formData.append('title', data.title);
      formData.append('artist', data.artist);
      formData.append('genre', data.genre);
      formData.append('mood', data.mood);
      formData.append('tags', JSON.stringify(data.tags));
      
      if (data.description) {
        formData.append('description', data.description);
      }
      
      if (data.lyrics) {
        formData.append('lyrics', data.lyrics);
      }
      
      formData.append('published', 'true');
      
      // Get or create API key with error handling
      let apiKey: string;
      try {
        apiKey = await getOrCreateApiKey(user.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get API key';
        toast.error(errorMessage);
        setIsUploading(false);
        return;
      }
      
      // Upload track with the API key
      const uploadResponse = await fetch('https://qkpjlfcpncvvjyzfolag.supabase.co/functions/v1/music-upload', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey
        },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Upload failed: HTTP ' + uploadResponse.status);
      }
      
      toast.success("Track uploaded successfully!");
      
      form.reset();
      setAudioFile(null);
      setCoverArt(null);
      setCoverArtPreview(null);
      setAnalyzedTags([]);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload track. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">AI-powered analysis</span>
          </div>
          <Button
            type="button"
            variant={isAutoAnalysisEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAutoAnalysisEnabled(!isAutoAnalysisEnabled)}
          >
            {isAutoAnalysisEnabled ? "Auto-Analysis: On" : "Auto-Analysis: Off"}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Music className="h-5 w-5" />
                Audio File
              </h3>
              
              <FileUploader 
                accept=".mp3,.wav"
                maxSize={30} // 30MB
                onFileSelected={onAudioFileSelected}
                selectedFile={audioFile}
                fileType="audio"
              />
            </div>

            <div className="bg-card border border-border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Cover Art
              </h3>
              
              {coverArtPreview ? (
                <div className="relative w-full">
                  <img 
                    src={coverArtPreview} 
                    alt="Cover art preview" 
                    className="w-full h-40 object-cover rounded-md"
                  />
                  <Button 
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                    onClick={clearCoverArt}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <FileUploader 
                  accept=".jpg,.jpeg,.png"
                  maxSize={5} // 5MB
                  onFileSelected={onCoverArtSelected}
                  selectedFile={coverArt}
                  fileType="image"
                />
              )}
            </div>
            
            {isAnalyzing && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-4 flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Analyzing track to suggest metadata...</span>
              </div>
            )}
            
            {analyzedTags.length > 0 && !isAnalyzing && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Suggested tags from analysis:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analyzedTags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-primary/20 text-primary px-2 py-1 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Track Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter track title" {...field} />
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
                  <FormLabel>Artist Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your artist name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isAnalyzing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isAnalyzing ? "Analyzing genre..." : "Select genre"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hip-hop">Hip Hop</SelectItem>
                        <SelectItem value="rnb">R&B</SelectItem>
                        <SelectItem value="pop">Pop</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="dance">Dance</SelectItem>
                        <SelectItem value="reggae">Reggae</SelectItem>
                        <SelectItem value="afrobeats">Afrobeats</SelectItem>
                        <SelectItem value="rock">Rock</SelectItem>
                        <SelectItem value="alternative">Alternative</SelectItem>
                        <SelectItem value="indie">Indie</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="folk">Folk</SelectItem>
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
                    <FormLabel>Mood</FormLabel>
                    <MoodSelector value={field.value} onChange={field.onChange} loading={isAnalyzing} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <TagInput tags={field.value} setTags={field.onChange} />
                  <FormDescription>
                    Add tags to help users discover your music. Press Enter after each tag.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell listeners about your track" 
                      className="min-h-20"
                      {...field} 
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
                  <FormLabel>
                    Lyrics (Optional)
                    {isAutoAnalysisEnabled && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Helps AI detect mood and themes)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add lyrics to your track" 
                      className="min-h-40" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          {audioFile && !isAnalyzing && isAutoAnalysisEnabled && (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => analyzeAudioContent()}
              disabled={isUploading}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Re-analyze Track
            </Button>
          )}
          
          <div className="ml-auto">
            <Button type="submit" disabled={isUploading || isAnalyzing} className="w-full md:w-auto">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Track
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
