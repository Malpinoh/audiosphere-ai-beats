
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, Music, FileImage, Tag, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  const onAudioFileSelected = (file: File) => {
    setAudioFile(file);
  };

  const onCoverArtSelected = (file: File) => {
    setCoverArt(file);
    
    // Create preview URL
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

  const onSubmit = async (data: UploadFormValues) => {
    if (!audioFile) {
      toast.error("Please upload an audio file");
      return;
    }

    if (!coverArt) {
      toast.error("Please upload cover art");
      return;
    }

    setIsUploading(true);

    try {
      // In a real app, you would upload the files and data to your backend here
      console.log("Form data:", data);
      console.log("Audio file:", audioFile);
      console.log("Cover art:", coverArt);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Track uploaded successfully!");
      
      // Reset form
      form.reset();
      setAudioFile(null);
      setCoverArt(null);
      setCoverArtPreview(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload track. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select genre" />
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
                    <MoodSelector value={field.value} onChange={field.onChange} />
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
                  <FormLabel>Lyrics (Optional)</FormLabel>
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

        <div className="flex justify-end">
          <Button type="submit" disabled={isUploading} className="w-full md:w-auto">
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
      </form>
    </Form>
  );
}
