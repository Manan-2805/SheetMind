import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents';

export default function FavoritesPage() {
  return (
    <div>
      <DocH1>Favorites & Organization</DocH1>
      <DocP>
        Organize your saved queries with favorites, renaming, and deletion to keep your query
        library clean and efficient.
      </DocP>
      <ImagePlaceholder label="Saved Queries — Favorites Section" />
      <DocH2>Starring Queries</DocH2>
      <DocP>
        Click the star icon on any saved query card to mark it as a favorite. Starred queries appear
        in a dedicated Pinned section at the top of the drawer, making them instantly accessible.
      </DocP>
      <DocH2>Pinned Section</DocH2>
      <DocP>
        The pinned section appears at the top of the Saved Queries drawer when you have at least one
        favorited query. Pinned queries are always visible without scrolling, making them ideal for
        your most frequently used queries.
      </DocP>
      <DocH2>Renaming Queries</DocH2>
      <DocP>
        Click the edit icon on any query card to rename it. The AI-generated label is replaced with
        your custom label. Labels should be short and descriptive for easy identification.
      </DocP>
      <DocH2>Deleting Queries</DocH2>
      <DocP>
        Click the delete icon to remove a saved query. A confirmation dialog appears. Deleting a
        saved query also:
      </DocP>
      <DocUl>
        <DocLi>Removes it from the Saved Queries drawer</DocLi>
        <DocLi>Unbinds it from any dashboard widgets (those widgets will show an error)</DocLi>
        <DocLi>Does NOT affect your chat history</DocLi>
      </DocUl>
    </div>
  );
}
