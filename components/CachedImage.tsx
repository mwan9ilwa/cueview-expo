import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageProps, StyleSheet, View } from 'react-native';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  cachePolicy?: 'memory' | 'disk' | 'reload';
  timeout?: number;
}

const CachedImage = memo(({ 
  uri, 
  placeholder, 
  fallback, 
  cachePolicy = 'memory',
  timeout = 10000,
  style,
  ...props 
}: CachedImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // For React Native, we can use the URI directly with cache headers
        // In a production app, you might want to implement proper image caching
        const cachedUri = `${uri}?cache=${cachePolicy}`;
        
        // Simulate timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Image load timeout')), timeout)
        );

        const imagePromise = new Promise((resolve) => {
          Image.prefetch(uri).then(() => {
            if (isMounted) {
              setImageUri(cachedUri);
              resolve(cachedUri);
            }
          }).catch(() => {
            if (isMounted) {
              setError(true);
            }
          });
        });

        await Promise.race([imagePromise, timeoutPromise]);
      } catch {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (uri) {
      loadImage();
    }

    return () => {
      isMounted = false;
    };
  }, [uri, cachePolicy, timeout]);

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        {placeholder || (
          <View style={styles.defaultPlaceholder}>
            <ActivityIndicator size="small" color="#999" />
          </View>
        )}
      </View>
    );
  }

  if (error || !imageUri) {
    return (
      <View style={[styles.container, style]}>
        {fallback || (
          <View style={styles.defaultFallback}>
            <IconSymbol name="photo" size={24} color="#999" />
          </View>
        )}
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{ uri: imageUri }}
      style={style}
      onError={() => setError(true)}
      onLoad={() => setLoading(false)}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  defaultFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

CachedImage.displayName = 'CachedImage';

export default CachedImage;
