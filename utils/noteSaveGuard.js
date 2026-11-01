/**
 * Extracted from NewNote's save guard to make save scheduling testable.
 * A pending save currently blocks every subsequent save request.
 */
export const shouldSkipNoteSave = ({
  saving,
  hasExistingNote,
  htmlChanged,
  titleChanged,
}) => saving || (hasExistingNote && !htmlChanged && !titleChanged);
