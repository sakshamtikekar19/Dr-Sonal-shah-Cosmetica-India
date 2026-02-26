# How to Add or Change Treatment Names on the Transformations Page

## File to edit
Open **`transformations.html`** in any text editor or Cursor.

---

## Steps to add a treatment name to a photo

Each transformation is one **card**. One card = one image + one treatment name + one short caption.

### 1. Find the card for that photo
- Search for the **image filename** (e.g. `transformation_09.png.jpeg` or `prp_hair_6sessions.png`).
- You’ll see a block that looks like this:

```html
<article class="transformation-card transformation-card--composite reveal">
  <div class="transformation-card-img-wrap">
    <img src="assets/transformations/transformation_09.png.jpeg" alt="..." ...>
  </div>
  <p class="transformation-caption"><span class="transformation-caption-title">Acne Scar Treatment</span> Smoother skin texture and reduced scarring</p>
</article>
```

### 2. Change the treatment name
- The **treatment name** is inside:  
  `<span class="transformation-caption-title"> ... </span>`
- Replace the text between the `>` and `<` with your new name.

**Example:**  
From: `Acne Scar Treatment`  
To: `Laser Acne Scar Treatment`

### 3. (Optional) Change the short caption
- The line under the title is the **caption** (e.g. “Smoother skin texture and reduced scarring”).
- Edit that text in the same `<p class="transformation-caption">` line, after the `</span>`.

### 4. (Optional) Update the image alt text
- In the `<img ...>` tag, find `alt="..."`
- Change the alt text to describe the treatment (good for accessibility and SEO).

---

## Steps to add a brand‑new transformation (new photo + treatment name)

1. **Put your before/after image** in the folder:  
   `assets/transformations/`  
   Use a clear name, e.g. `transformation_new1.jpg` or `my_treatment.png`.

2. **Open `transformations.html`** and find the **transformations grid** (search for `transformations-grid`).

3. **Copy an existing card** (one full `<article>...</article>` block).

4. **Paste** it just before the closing `</div>` of the grid.

5. **Edit the pasted card:**
   - **Image:** Change `src="assets/transformations/..."` to your new filename.
   - **Treatment name:** Change the text inside `<span class="transformation-caption-title">...</span>`.
   - **Caption:** Change the text after `</span>` in the same `<p class="transformation-caption">` line.
   - **Alt text:** Update `alt="..."` in the `<img>` tag to describe the treatment.

6. **Save** the file and refresh the website to see the new transformation.

---

## Quick reference

| What you see on the page   | Where it is in the HTML                                      |
|----------------------------|--------------------------------------------------------------|
| The photo                  | `<img src="assets/transformations/FILENAME" ...>`           |
| The treatment name (bold)  | `<span class="transformation-caption-title">NAME HERE</span>` |
| The caption under the name| Text after `</span>` in `<p class="transformation-caption">` |

One card = one photo + one treatment name + one caption. Change the text in that card to change the name/caption for that photo.
