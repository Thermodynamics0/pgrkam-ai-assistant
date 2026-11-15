
require("dotenv").config();

async function testJooble() {
  const locations = [
    "Punjab, India",
    "Chandigarh, India",
    "Ludhiana, Punjab, India"
  ];

  for (const location of locations) {
    try {
      const response = await fetch(
        `${process.env.JOOBLE_API_URL}/${process.env.JOOBLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keywords: "software developer",
            location
          })
        }
      );

      const data = await response.json();

      console.log("\n--------------------------");
      console.log("LOCATION:", location);
      console.log("STATUS:", response.status);
      console.log("TOTAL:", data.totalCount);

      data.jobs?.slice(0, 5).forEach((job, index) => {
        console.log(`${index + 1}. ${job.title}`);
        console.log("Company:", job.company);
        console.log("Job location:", job.location);
        console.log("Link:", job.link);
      });
    } catch (error) {
      console.error(location, error.message);
    }
  }
}

testJooble();
