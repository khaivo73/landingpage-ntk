# Typography review

Body copy and form inputs use 16px. Supporting text uses at least 14px instead of the previous 8–13px declarations. Headings retain a distinct responsive hierarchy. Buttons use 16px; mobile actions stack on narrow screens. Input heights, form gaps, card lists and footer wrapping accommodate the larger type. Existing system fonts avoid a new external font dependency.

Muted labels that measured below 4.5:1 against white were darkened to #52677f (approximately 5.82:1). Image-caption backgrounds were darkened for legibility. This is a focused typography review, not a claim of full accessibility certification.

The first deployed revision was checked in the connected desktop browser at its actual approximately 1920px viewport. Visible paragraph/list/label/note/button elements below 14px: zero. Visible form inputs/selects: 16px. No document-wide horizontal overflow was observed.

Responsive CSS was reviewed for 320px, 390px and tablet breakpoints. Automated mobile rendering could not be verified in this session: the connected browser's viewport override did not alter its actual viewport; an isolated local test browser was blocked by the execution environment. No real-device mobile test is claimed.

Production build, type checking, 23 JavaScript tests and 11 Python tests passed for the combined release. Typography changes do not alter form validation, package prices or the data processing contract.
