import { Book } from '@shared/types';
import { ExternalLink, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Card className="h-full flex flex-col hover-elevate active-elevate-2 transition-all" data-testid={`card-book`}>
      <div className="p-4 flex flex-col h-full">
        {/* Book Cover Placeholder */}
        <div className="aspect-[3/4] bg-gradient-to-br from-brand-light to-brand-accent/20 rounded-md mb-3 flex items-center justify-center" data-testid="book-cover">
          <BookOpen className="h-12 w-12 text-brand-primary/30" />
        </div>
        
        {/* Book Info */}
        <div className="flex-1 flex flex-col">
          <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-2" data-testid="text-book-title">
            {book.title}
          </h4>
          <p className="text-xs text-muted-foreground mb-3" data-testid="text-book-publisher">
            {book.publisher}
          </p>
          
          <a
            href={book.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-1 text-xs text-brand-primary hover:text-brand-secondary transition-colors"
            data-testid="link-book-purchase"
          >
            <span>구매하기</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}
